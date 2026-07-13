import { describe, it, expect } from "vitest";
import {
  isCategoryGranted,
  hasDecision,
  makeDecision,
  acceptAll,
  rejectOptional,
  encodeConsent,
  parseConsentCookie,
  shouldLoadAnalytics,
  shouldLoadAds,
  CONSENT_VERSION,
  type ConsentState,
} from "./consent";

const NOW = "2026-07-13T00:00:00.000Z";

describe("default state (no decision yet)", () => {
  const NONE: ConsentState = null;

  it("treats every optional category as OFF until the parent opts in", () => {
    expect(isCategoryGranted(NONE, "analytics")).toBe(false);
    expect(isCategoryGranted(NONE, "advertising")).toBe(false);
  });

  it("keeps strictly-necessary always on, even with no decision", () => {
    expect(isCategoryGranted(NONE, "necessary")).toBe(true);
  });

  it("reports no decision so the banner shows", () => {
    expect(hasDecision(NONE)).toBe(false);
  });

  it("loads neither analytics nor ads by default, even when configured on", () => {
    expect(shouldLoadAnalytics(NONE, { enabled: true })).toBe(false);
    expect(shouldLoadAds(NONE, { enabled: true })).toBe(false);
  });
});

describe("granting and revoking per category", () => {
  it("accept-all turns both optional categories on", () => {
    const state = acceptAll(NOW);
    expect(isCategoryGranted(state, "analytics")).toBe(true);
    expect(isCategoryGranted(state, "advertising")).toBe(true);
    expect(hasDecision(state)).toBe(true);
  });

  it("reject-optional records a real decision with both off", () => {
    const state = rejectOptional(NOW);
    expect(isCategoryGranted(state, "analytics")).toBe(false);
    expect(isCategoryGranted(state, "advertising")).toBe(false);
    // A rejection is still a decision, so the banner does not reappear.
    expect(hasDecision(state)).toBe(true);
  });

  it("supports granting one category while refusing the other", () => {
    const analyticsOnly = makeDecision({ analytics: true, advertising: false }, NOW);
    expect(isCategoryGranted(analyticsOnly, "analytics")).toBe(true);
    expect(isCategoryGranted(analyticsOnly, "advertising")).toBe(false);

    const adsOnly = makeDecision({ analytics: false, advertising: true }, NOW);
    expect(isCategoryGranted(adsOnly, "analytics")).toBe(false);
    expect(isCategoryGranted(adsOnly, "advertising")).toBe(true);
  });

  it("revoking a category (grant then reject) flips it back off", () => {
    const granted = acceptAll(NOW);
    const revoked = makeDecision({ analytics: false, advertising: false }, NOW);
    expect(isCategoryGranted(granted, "analytics")).toBe(true);
    expect(isCategoryGranted(revoked, "analytics")).toBe(false);
  });

  it("records when the choice was made", () => {
    expect(acceptAll(NOW).updatedAt).toBe(NOW);
  });
});

describe("persistence (encode / parse round-trip)", () => {
  it("round-trips a decision through the cookie value", () => {
    const state = makeDecision({ analytics: true, advertising: false }, NOW);
    const parsed = parseConsentCookie(encodeConsent(state));
    expect(parsed).toEqual(state);
  });

  it("round-trips a URL-encoded cookie value", () => {
    const state = acceptAll(NOW);
    const parsed = parseConsentCookie(encodeURIComponent(encodeConsent(state)));
    expect(parsed).toEqual(state);
  });

  it("returns null (default off) for a missing or blank value", () => {
    expect(parseConsentCookie(undefined)).toBeNull();
    expect(parseConsentCookie(null)).toBeNull();
    expect(parseConsentCookie("")).toBeNull();
  });

  it("returns null for malformed JSON rather than throwing", () => {
    expect(parseConsentCookie("not-json")).toBeNull();
    expect(parseConsentCookie("{oops")).toBeNull();
  });

  it("rejects a stale schema version so the parent is re-asked", () => {
    const stale = JSON.stringify({
      version: CONSENT_VERSION + 1,
      analytics: true,
      advertising: true,
      updatedAt: NOW,
    });
    expect(parseConsentCookie(stale)).toBeNull();
  });

  it("rejects a wrong-shape payload (missing or non-boolean fields)", () => {
    expect(parseConsentCookie(JSON.stringify({ version: CONSENT_VERSION }))).toBeNull();
    expect(
      parseConsentCookie(
        JSON.stringify({ version: CONSENT_VERSION, analytics: "yes", advertising: true, updatedAt: NOW }),
      ),
    ).toBeNull();
  });
});

describe('"should X load?" reflects consent', () => {
  it("analytics loads only when configured on AND consented", () => {
    const granted = acceptAll(NOW);
    const refused = rejectOptional(NOW);
    // configured on, consented -> loads
    expect(shouldLoadAnalytics(granted, { enabled: true })).toBe(true);
    // configured on, refused -> off
    expect(shouldLoadAnalytics(refused, { enabled: true })).toBe(false);
    // consented but not configured (no measurement id) -> off
    expect(shouldLoadAnalytics(granted, { enabled: false })).toBe(false);
  });

  it("ads load only when configured on AND consented", () => {
    const granted = acceptAll(NOW);
    const refused = rejectOptional(NOW);
    expect(shouldLoadAds(granted, { enabled: true })).toBe(true);
    expect(shouldLoadAds(refused, { enabled: true })).toBe(false);
    expect(shouldLoadAds(granted, { enabled: false })).toBe(false);
  });

  it("consent to one optional category does not enable the other path", () => {
    const analyticsOnly = makeDecision({ analytics: true, advertising: false }, NOW);
    expect(shouldLoadAnalytics(analyticsOnly, { enabled: true })).toBe(true);
    expect(shouldLoadAds(analyticsOnly, { enabled: true })).toBe(false);
  });
});
