import { describe, it, expect, vi } from "vitest";
import {
  getAnalyticsConfig,
  sanitizeParams,
  isPersonalKey,
  track,
  type AnalyticsConfig,
  type AnalyticsParamValue,
  type AnalyticsEvent,
} from "./analytics";
import { acceptAll, rejectOptional, type ConsentState } from "./consent";

/** A config with analytics on, for exercising track() without env coupling. */
const ENABLED: AnalyticsConfig = {
  enabled: true,
  provider: "ga4",
  measurementId: "G-TEST123",
};
const DISABLED: AnalyticsConfig = { ...ENABLED, enabled: false };

// track() also requires the parent to have granted analytics consent (issue #50).
// These stand in for that choice so the transport tests are not env/cookie coupled.
const GRANTED: ConsentState = acceptAll("2026-07-13T00:00:00.000Z");
const REFUSED: ConsentState = rejectOptional("2026-07-13T00:00:00.000Z");

/** A spy transport plus the last call it recorded. */
function spySend() {
  const calls: Array<{ event: AnalyticsEvent; params: Record<string, AnalyticsParamValue> }> = [];
  const send = vi.fn((event: AnalyticsEvent, params: Record<string, AnalyticsParamValue>) => {
    calls.push({ event, params });
  });
  return { send, calls };
}

describe("getAnalyticsConfig", () => {
  it("is disabled with no measurement id (clean local dev / CI)", () => {
    const config = getAnalyticsConfig({});
    expect(config.enabled).toBe(false);
    expect(config.measurementId).toBeNull();
    expect(config.provider).toBe("ga4");
  });

  it("enables from just the measurement id (kill switch defaults on)", () => {
    const config = getAnalyticsConfig({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123" });
    expect(config.enabled).toBe(true);
    expect(config.measurementId).toBe("G-ABC123");
  });

  it("treats a blank measurement id the same as missing", () => {
    const config = getAnalyticsConfig({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "   " });
    expect(config.measurementId).toBeNull();
    expect(config.enabled).toBe(false);
  });

  it("kill switch off disables even when a measurement id is present", () => {
    const off = getAnalyticsConfig({
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123",
      NEXT_PUBLIC_ANALYTICS_ENABLED: "false",
    });
    expect(off.enabled).toBe(false);
    // "0" is also off; anything else falls back to on.
    expect(getAnalyticsConfig({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-X", NEXT_PUBLIC_ANALYTICS_ENABLED: "0" }).enabled).toBe(false);
    expect(getAnalyticsConfig({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-X", NEXT_PUBLIC_ANALYTICS_ENABLED: "true" }).enabled).toBe(true);
    expect(getAnalyticsConfig({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-X", NEXT_PUBLIC_ANALYTICS_ENABLED: "yes" }).enabled).toBe(true);
  });
});

describe("isPersonalKey", () => {
  it("flags keys that could carry personal data", () => {
    for (const key of ["name", "childName", "child_name", "email", "parentEmail", "userId", "user_id", "uid", "sessionId", "ipAddress", "phone"]) {
      expect(isPersonalKey(key)).toBe(true);
    }
  });

  it("allows non-personal analytics keys", () => {
    for (const key of ["story", "age_band", "plan", "choice_index", "ending_category", "method", "from"]) {
      expect(isPersonalKey(key)).toBe(false);
    }
  });
});

describe("sanitizeParams", () => {
  it("keeps non-personal primitive params", () => {
    expect(sanitizeParams({ story: "bean-woods", choice_index: 2, complete: true })).toEqual({
      story: "bean-woods",
      choice_index: 2,
      complete: true,
    });
  });

  it("drops personal-looking keys (child name, parent email, user id)", () => {
    const clean = sanitizeParams({
      story: "bean-woods",
      childName: "Ada",
      parentEmail: "mom@example.com",
      userId: "user_123",
      sessionId: "sess_abc",
    });
    expect(clean).toEqual({ story: "bean-woods" });
  });

  it("drops non-primitive and null/undefined values", () => {
    const clean = sanitizeParams({
      story: "bean-woods",
      nested: { name: "Ada" } as unknown as AnalyticsParamValue,
      missing: undefined,
      empty: null,
    });
    expect(clean).toEqual({ story: "bean-woods" });
  });

  it("returns an empty object for no params", () => {
    expect(sanitizeParams()).toEqual({});
  });
});

describe("track", () => {
  it("fires the event with sanitized params through the transport", () => {
    const { send, calls } = spySend();
    track("story_started", { story: "bean-woods", age_band: "2-4" }, { config: ENABLED, consent: GRANTED, send });
    expect(send).toHaveBeenCalledTimes(1);
    expect(calls[0]).toEqual({ event: "story_started", params: { story: "bean-woods", age_band: "2-4" } });
  });

  it("no-ops when analytics is disabled", () => {
    const { send } = spySend();
    track("story_started", { story: "bean-woods" }, { config: DISABLED, consent: GRANTED, send });
    expect(send).not.toHaveBeenCalled();
  });

  it("no-ops until analytics consent is granted, even when enabled", () => {
    const { send } = spySend();
    // No decision yet (null): nothing fires.
    track("story_started", { story: "bean-woods" }, { config: ENABLED, consent: null, send });
    // Consent explicitly refused: nothing fires.
    track("story_started", { story: "bean-woods" }, { config: ENABLED, consent: REFUSED, send });
    expect(send).not.toHaveBeenCalled();
  });

  it("strips personal fields before they reach the transport", () => {
    const { send, calls } = spySend();
    track(
      "ending_found",
      { story: "bean-woods", ending_category: "good", childName: "Ada", parentEmail: "mom@example.com", userId: "u1" },
      { config: ENABLED, consent: GRANTED, send },
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(calls[0].params).toEqual({ story: "bean-woods", ending_category: "good" });
    // Explicitly assert none of the personal fields survived.
    expect(calls[0].params).not.toHaveProperty("childName");
    expect(calls[0].params).not.toHaveProperty("parentEmail");
    expect(calls[0].params).not.toHaveProperty("userId");
  });

  it("fires with no params as an empty param object", () => {
    const { send, calls } = spySend();
    track("paywall_shown", undefined, { config: ENABLED, consent: GRANTED, send });
    expect(calls[0]).toEqual({ event: "paywall_shown", params: {} });
  });
});
