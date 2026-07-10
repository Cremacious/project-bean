import { describe, it, expect } from "vitest";
import type { Subscription } from "@/lib/entitlements";
import { getAdsConfig, shouldShowAds, type AdsConfig } from "./ads";

// A free (not entitled) and an entitled subscription, built from the real shape.
const FREE: Pick<Subscription, "isActive"> = { isActive: false };
const SUBSCRIBED: Pick<Subscription, "isActive"> = { isActive: true };
// A trial resolves to isActive === true upstream (lib/entitlements), so from the
// ad gate's point of view "trialing" is indistinguishable from a paid subscriber.
const TRIALING: Pick<Subscription, "isActive"> = { isActive: true };

/** House ads enabled: the kill switch is on and house needs no unit id. */
const ENABLED: AdsConfig = {
  enabled: true,
  network: "house",
  superawesomePlacementId: null,
  googleAdUnitId: null,
};

describe("shouldShowAds", () => {
  it("shows ads to a free-tier parent when ads are enabled", () => {
    expect(shouldShowAds(FREE, ENABLED)).toBe(true);
  });

  it("never shows ads to a subscriber", () => {
    expect(shouldShowAds(SUBSCRIBED, ENABLED)).toBe(false);
  });

  it("never shows ads to a trial user", () => {
    expect(shouldShowAds(TRIALING, ENABLED)).toBe(false);
  });

  it("shows no ads to anyone when the kill switch is off, even a free parent", () => {
    const off: AdsConfig = { ...ENABLED, enabled: false };
    expect(shouldShowAds(FREE, off)).toBe(false);
    expect(shouldShowAds(SUBSCRIBED, off)).toBe(false);
  });
});

describe("getAdsConfig", () => {
  it("is disabled with no ad env set (clean local dev / CI)", () => {
    const config = getAdsConfig({});
    expect(config.enabled).toBe(false);
    expect(config.network).toBe("house");
    // A free parent still sees nothing, because nothing is configured.
    expect(shouldShowAds(FREE, config)).toBe(false);
  });

  it("enables house ads from just the kill switch (no unit id needed)", () => {
    const config = getAdsConfig({ ADS_ENABLED: "true" });
    expect(config.enabled).toBe(true);
    expect(config.network).toBe("house");
    expect(shouldShowAds(FREE, config)).toBe(true);
  });

  it("treats the kill switch as off unless it is exactly true or 1", () => {
    expect(getAdsConfig({ ADS_ENABLED: "false" }).enabled).toBe(false);
    expect(getAdsConfig({ ADS_ENABLED: "yes" }).enabled).toBe(false);
    expect(getAdsConfig({ ADS_ENABLED: "" }).enabled).toBe(false);
    expect(getAdsConfig({ ADS_ENABLED: "TRUE" }).enabled).toBe(true);
    expect(getAdsConfig({ ADS_ENABLED: "1" }).enabled).toBe(true);
  });

  it("keeps a third-party network OFF until its unit id is present (missing config)", () => {
    const missing = getAdsConfig({ ADS_ENABLED: "true", NEXT_PUBLIC_ADS_NETWORK: "superawesome" });
    expect(missing.enabled).toBe(false);
    expect(shouldShowAds(FREE, missing)).toBe(false);

    const ready = getAdsConfig({
      ADS_ENABLED: "true",
      NEXT_PUBLIC_ADS_NETWORK: "superawesome",
      NEXT_PUBLIC_SUPERAWESOME_PLACEMENT_ID: "placement_123",
    });
    expect(ready.enabled).toBe(true);
    expect(ready.superawesomePlacementId).toBe("placement_123");
  });

  it("keeps Google Ad Manager OFF until its ad unit id is present", () => {
    const missing = getAdsConfig({ ADS_ENABLED: "true", NEXT_PUBLIC_ADS_NETWORK: "google-gam" });
    expect(missing.enabled).toBe(false);

    const ready = getAdsConfig({
      ADS_ENABLED: "true",
      NEXT_PUBLIC_ADS_NETWORK: "google-gam",
      NEXT_PUBLIC_GOOGLE_AD_UNIT_ID: "/1234/kids_banner",
    });
    expect(ready.enabled).toBe(true);
    expect(ready.googleAdUnitId).toBe("/1234/kids_banner");
  });

  it("falls back to the safe house network for an unknown network value", () => {
    expect(getAdsConfig({ ADS_ENABLED: "true", NEXT_PUBLIC_ADS_NETWORK: "banana" }).network).toBe("house");
  });

  it("treats a blank unit id the same as missing", () => {
    const config = getAdsConfig({
      ADS_ENABLED: "true",
      NEXT_PUBLIC_ADS_NETWORK: "superawesome",
      NEXT_PUBLIC_SUPERAWESOME_PLACEMENT_ID: "   ",
    });
    expect(config.superawesomePlacementId).toBeNull();
    expect(config.enabled).toBe(false);
  });
});
