// lib/ads.ts
//
// Kid-safe advertising config and the single "show ads?" decision (issue #37).
//
// Compliance posture (docs/COMPLIANCE-COPPA.md section 6a): every ad path is
// NON-personalized / child-directed (contextual only, no behavioral tracking, no
// persistent identifiers, no child data shared). Ads are shown to FREE-tier
// parents ONLY; subscribers and trial users never see an ad and never load any ad
// code. That free vs premium line is read through the ONE app-wide entitlement
// source of truth from issue #33 (lib/entitlements.ts, `subscription.isActive`),
// exactly like the free-tier story gate in #34 (lib/stories/access.ts). `isActive`
// already folds in trials and fails safe to "not subscribed", so a billing outage
// can never accidentally start showing ads to a paying family.
//
// Provider-agnostic by design: the network is a swap-in behind a global kill
// switch and env config. "house" (self-promotion, zero third party) is the safe
// default that ships today; a paid kid-safe network can be wired later without
// touching placement, gating, labeling, or the graceful-when-disabled behavior.
import type { Subscription } from "@/lib/entitlements";

/**
 * The ad render paths we support.
 *  - "house": our own promos. No third party, no identifiers, no data leaves the
 *    app. The safe default.
 *  - "superawesome": kid-focused contextual network (SuperAwesome AwesomeAds style).
 *  - "google-gam": Google Ad Manager in child-directed (tfcd) + non-personalized
 *    mode. NOT plain AdSense, whose policy restricts made-for-kids sites.
 * Only "house" renders today; the others are recognized config so the abstraction
 * is ready to plug in after vendor and LAWYER sign-off (docs/COMPLIANCE-COPPA.md
 * section 6a and section 9 question 3).
 */
export type AdNetwork = "house" | "superawesome" | "google-gam";

export type AdsConfig = {
  /**
   * The effective on/off: true only when the kill switch is on AND the selected
   * network has what it needs to render. Everything else in the app asks this,
   * never the raw env, so "disabled" is a single, honest boolean.
   */
  enabled: boolean;
  /** Which render path is selected. */
  network: AdNetwork;
  /** SuperAwesome placement id, or null when unset. */
  superawesomePlacementId: string | null;
  /** Google Ad Manager ad unit id, or null when unset. */
  googleAdUnitId: string | null;
};

/** Where an ad slot sits, so house copy and future contextual networks have context. */
export type AdPlacement = "library" | "collection";

const AD_NETWORKS: readonly AdNetwork[] = ["house", "superawesome", "google-gam"];

/** An env-var value counts as "on" only for an explicit true/1 (case-insensitive). */
function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** A trimmed, non-empty string, or null. Keeps "missing" and "blank" the same. */
function cleanId(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** The selected network, defaulting to the safe "house" path for absent/unknown values. */
function parseNetwork(value: string | undefined): AdNetwork {
  const v = value?.trim().toLowerCase();
  return AD_NETWORKS.includes(v as AdNetwork) ? (v as AdNetwork) : "house";
}

/**
 * Resolve the ad config from the environment (injectable for tests).
 *
 * The app runs cleanly with NO ad env set: the kill switch defaults off, so local
 * dev and CI show no ads and load no ad code. A third-party network stays off
 * until BOTH the kill switch is on AND its unit id is present, so a half-configured
 * network degrades to "no ads" rather than a broken or non-compliant slot. House
 * ads need no unit id, so they are ready as soon as the kill switch is on.
 */
export function getAdsConfig(env: NodeJS.ProcessEnv = process.env): AdsConfig {
  const killSwitch = parseBool(env.ADS_ENABLED);
  const network = parseNetwork(env.NEXT_PUBLIC_ADS_NETWORK);
  const superawesomePlacementId = cleanId(env.NEXT_PUBLIC_SUPERAWESOME_PLACEMENT_ID);
  const googleAdUnitId = cleanId(env.NEXT_PUBLIC_GOOGLE_AD_UNIT_ID);

  const networkReady =
    network === "house"
      ? true
      : network === "superawesome"
        ? superawesomePlacementId !== null
        : network === "google-gam"
          ? googleAdUnitId !== null
          : false;

  return {
    enabled: killSwitch && networkReady,
    network,
    superawesomePlacementId,
    googleAdUnitId,
  };
}

/**
 * The single ad-gating decision. Ads render only when ads are enabled AND the
 * parent is NOT entitled. Subscribers and trial users (isActive === true) always
 * get false, so they never see ads and their pages never emit any ad code.
 *
 * Pure and dependency-free (takes the already-resolved subscription and config),
 * so it unit tests without a database: free, subscribed, trialing, kill-switch
 * off, and missing-config all collapse to this one function.
 */
export function shouldShowAds(
  subscription: Pick<Subscription, "isActive">,
  config: AdsConfig,
): boolean {
  if (!config.enabled) return false;
  if (subscription.isActive) return false;
  return true;
}
