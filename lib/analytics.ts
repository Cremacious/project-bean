// lib/analytics.ts
//
// Privacy-safe product analytics for a CHILD-DIRECTED app (issue #38).
//
// Compliance posture (docs/COMPLIANCE-COPPA.md section 6b and section 9 Q2):
// analytics here is configured for child-directed / restricted use. That means
// NO advertising or remarketing signals, NO Google Signals, IP anonymization,
// and NO identifiers that map to a person. The child's first name, the parent's
// email, and any user id NEVER leave the app through this path. Two guarantees
// enforce that:
//   1. Only a fixed, non-personal event taxonomy is defined (see AnalyticsEvent).
//   2. Every event's params run through sanitizeParams(), which drops any key
//      that looks personal and any non-primitive value, as defense in depth.
//
// Provider-agnostic by design (mirrors lib/ads.ts): the whole app fires events
// through the ONE track() helper, so analytics is trivial to disable globally (a
// kill switch) or swap to a different provider (e.g. a cookieless tool) without
// touching a single call site. GA4 is the wired provider; it stays fully OFF
// when its measurement id is absent, so local dev and CI run clean with no
// analytics and no network calls.

/**
 * The complete, non-personal event taxonomy. This union is the single source of
 * truth: track() only accepts these names, so a typo or an ad-hoc event fails to
 * compile. Every event carries only non-identifying params (see AnalyticsParams).
 *
 * Fired on the web today:
 *  - story_started      a reader opened a story (params: story slug, age band)
 *  - choice_made        a choice was tapped (params: story slug, choice index)
 *  - ending_found       a reader reached an ending (params: story slug, ending
 *                       CATEGORY "good" vs "game_over", never which child)
 *  - paywall_shown      a locked premium story showed the paywall (params: story slug)
 *  - subscribe_started  a parent committed to a plan and passed the grown-up gate
 *                       (params: plan type)
 *  - signup_completed   a parent account was created (params: method)
 *
 * Reserved for the native app / RevenueCat webhook (M6, #55), where the real
 * purchase happens; defined here so the taxonomy is complete and consistent:
 *  - story_finished     a reading session finished
 *  - trial_started      a free trial actually began
 *  - subscribe_completed a paid subscription actually began
 */
export type AnalyticsEvent =
  | "story_started"
  | "story_finished"
  | "choice_made"
  | "ending_found"
  | "paywall_shown"
  | "subscribe_started"
  | "subscribe_completed"
  | "trial_started"
  | "signup_completed";

/**
 * The only value types allowed on an event. GA4 wants flat primitives, and
 * restricting to these also blocks a nested object from smuggling personal data
 * in. sanitizeParams() enforces this at runtime.
 */
export type AnalyticsParamValue = string | number | boolean;
export type AnalyticsParams = Record<string, AnalyticsParamValue | null | undefined>;

/** Which measurement provider is wired. Extensible (e.g. a cookieless tool later). */
export type AnalyticsProvider = "ga4";

export type AnalyticsConfig = {
  /**
   * The effective on/off. True only when a measurement id is present AND the kill
   * switch is not flipped off. Everything asks this, never the raw env, so
   * "disabled" is a single honest boolean and the app runs clean with no id set.
   */
  enabled: boolean;
  /** The wired provider. */
  provider: AnalyticsProvider;
  /** The GA4 measurement id (G-XXXXXXX), or null when unset. */
  measurementId: string | null;
  /**
   * Whether the region requires opt-in consent before any analytics loads. When
   * true, the loader waits for the consent banner (#50) to grant it. When false,
   * analytics loads in a strictly non-personal, child-directed configuration.
   * Defaults to false.
   */
  requireConsent: boolean;
};

/**
 * An opt-in flag: on only for an explicit true/1 (case-insensitive), else off.
 * Used for flags that must default OFF (e.g. requiring consent).
 */
function parseOptIn(value: string | undefined): boolean {
  if (value === undefined) return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1";
}

/**
 * A kill switch: on by default, OFF only when explicitly "false" or "0". Anything
 * else (including blank or absent) leaves it on, so it is a true global disable
 * that takes a deliberate value to trip.
 */
function isKilled(value: string | undefined): boolean {
  if (value === undefined) return false;
  const v = value.trim().toLowerCase();
  return v === "false" || v === "0";
}

/** A trimmed, non-empty string, or null. Keeps "missing" and "blank" the same. */
function cleanId(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/**
 * Resolve the analytics config from the environment (injectable for tests).
 *
 * Enabled requires BOTH a measurement id AND the kill switch not being flipped
 * off. The kill switch (NEXT_PUBLIC_ANALYTICS_ENABLED) defaults to ON when an id
 * is present, so setting it to "false" is a one-line global disable that keeps
 * the id in place. With no id, analytics is simply off: local dev and CI load no
 * analytics code and make no analytics network calls.
 */
export function getAnalyticsConfig(env: NodeJS.ProcessEnv = process.env): AnalyticsConfig {
  const measurementId = cleanId(env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const requireConsent = parseOptIn(env.NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT);
  return {
    enabled: measurementId !== null && !isKilled(env.NEXT_PUBLIC_ANALYTICS_ENABLED),
    provider: "ga4",
    measurementId,
    requireConsent,
  };
}

// The personal-key denylist is single-sourced in lib/pii-keys.ts so analytics and
// crash reporting scrub the exact same fields (they must never drift). Imported
// for use below and re-exported so analytics' own call sites and tests keep
// importing it from one place.
import { isPersonalKey } from "./pii-keys";
export { isPersonalKey };

/**
 * Strip anything we must never send: personal-looking keys, non-primitive values
 * (objects/functions that could hide PII), and null/undefined. This is defense in
 * depth. Call sites are already supposed to pass only non-personal params, but
 * this guarantees that even a future mistake cannot leak a name, email, or id.
 */
export function sanitizeParams(params?: AnalyticsParams): Record<string, AnalyticsParamValue> {
  const clean: Record<string, AnalyticsParamValue> = {};
  if (!params) return clean;
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const t = typeof value;
    if (t !== "string" && t !== "number" && t !== "boolean") continue;
    if (isPersonalKey(key)) continue;
    clean[key] = value as AnalyticsParamValue;
  }
  return clean;
}

/** How a sanitized event is delivered. Injectable so track() unit tests without a browser. */
export type SendFn = (event: AnalyticsEvent, params: Record<string, AnalyticsParamValue>) => void;

type GtagWindow = Window & {
  gtag?: (command: "event", event: string, params?: Record<string, unknown>) => void;
};

/** Default transport: hand the event to gtag if GA4 has loaded, else no-op. Never throws. */
function gtagSend(event: AnalyticsEvent, params: Record<string, AnalyticsParamValue>): void {
  if (typeof window === "undefined") return;
  const gtag = (window as GtagWindow).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", event, params);
  } catch {
    // Analytics must never break the app. Swallow any transport error.
  }
}

type TrackOptions = {
  /** Override the resolved config (tests / SSR-safety). */
  config?: AnalyticsConfig;
  /** Override the transport (tests). */
  send?: SendFn;
};

/**
 * The ONE analytics entry point. Fire a non-personal event by name with optional
 * non-personal params, e.g. track("story_started", { story: slug }).
 *
 * It no-ops silently when analytics is disabled (no measurement id or kill switch
 * off), sanitizes params so no personal data can leave, and never throws. Because
 * every call goes through here, the whole app is disabled by flipping one env var
 * and re-provider-ed by changing one function.
 */
export function track(event: AnalyticsEvent, params?: AnalyticsParams, opts: TrackOptions = {}): void {
  const config = opts.config ?? getAnalyticsConfig();
  if (!config.enabled) return;
  const send = opts.send ?? gtagSend;
  send(event, sanitizeParams(params));
}
