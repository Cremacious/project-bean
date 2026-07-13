// lib/consent.ts
//
// The ONE consent model for tracking technologies in a CHILD-DIRECTED app
// (issue #50). This is the single source of truth that both analytics (#38) and
// advertising (#37) read, so there is exactly one place a parent's choice lives
// and exactly one signal every tracking path consumes. No competing flags.
//
// Compliance posture (docs/COMPLIANCE-COPPA.md sections 3 and 6): nothing that
// tracks, profiles, or sets a persistent identifier may run before a parent opts
// in. So the two optional categories default OFF and stay off until the banner
// records a real choice. Only strictly-necessary technology (auth session,
// security) runs without consent, because the app cannot function without it and
// it never profiles the child.
//
// Deliberately pure and framework-free: no React, no next/headers, no I/O. It is
// imported by client components, by the server render (via the consent cookie),
// and by unit tests alike, so the "is this category allowed?" decision is one
// small, fully testable function that behaves identically everywhere.

/**
 * The consent categories. `necessary` is always on and is not a choice; the two
 * optional categories are the ones the banner toggles and both default OFF.
 *  - necessary:   auth session, security, keeping the parent signed in. Always on.
 *  - analytics:   privacy-safe product measurement (Google Analytics, #38).
 *  - advertising: contextual, child-directed ads (#37) and any ad identifiers.
 */
export type ConsentCategory = "necessary" | "analytics" | "advertising";

/** The categories a parent can turn on or off. `necessary` is intentionally absent. */
export const OPTIONAL_CATEGORIES = ["analytics", "advertising"] as const;
export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number];

/**
 * The consent schema version. Bump this whenever the categories or what they
 * cover changes: a stored choice made against an older version is treated as "no
 * decision yet", so the parent is asked again rather than silently governed by a
 * choice they never actually made about the new use.
 */
export const CONSENT_VERSION = 1;

/**
 * The first-party cookie that stores the choice. A cookie (not localStorage) so
 * the SAME recorded choice is readable by the browser (the banner) AND by the
 * server render (analytics-scripts.tsx, ad-slot.tsx), which is what lets us gate
 * loading on the server before any tracking code is ever sent to the client.
 */
export const CONSENT_COOKIE = "bq_consent";

/** How long a recorded choice lasts before the banner asks again (about 6 months). */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/**
 * A recorded parental choice. Stored (as JSON in the cookie) so we can prove what
 * was consented and when: the per-category booleans are the "what", `updatedAt`
 * is the "when", and `version` pins it to the model that was shown at the time.
 */
export type ConsentDecision = {
  /** The consent schema version this choice was made against. */
  version: number;
  /** Whether analytics is allowed to load and record. */
  analytics: boolean;
  /** Whether advertising is allowed to load. */
  advertising: boolean;
  /** ISO 8601 timestamp of when the parent made (or last changed) this choice. */
  updatedAt: string;
};

/**
 * The consent state as the app holds it: either a recorded decision, or `null`
 * meaning "no valid decision yet" (first visit, cleared cookie, or a choice made
 * against an outdated version). `null` is the safe default: every optional
 * category reads as OFF until a real decision replaces it.
 */
export type ConsentState = ConsentDecision | null;

/**
 * The one authorization check. Is `category` allowed given the current state?
 *  - necessary is always allowed (it is not gated).
 *  - an optional category is allowed only when a valid decision grants it; with
 *    no decision (`null`) it is OFF. This is what guarantees "default off until
 *    the parent opts in" for every caller, in one place.
 */
export function isCategoryGranted(state: ConsentState, category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  if (state === null) return false;
  return state[category] === true;
}

/** True once the parent has made a valid, current-version choice (so the banner can hide). */
export function hasDecision(state: ConsentState): boolean {
  return state !== null;
}

/**
 * Build a decision from a set of optional-category choices. `now` is injected (an
 * ISO string) rather than read from the clock so this stays pure and testable.
 */
export function makeDecision(
  choices: Record<OptionalCategory, boolean>,
  now: string,
): ConsentDecision {
  return {
    version: CONSENT_VERSION,
    analytics: choices.analytics === true,
    advertising: choices.advertising === true,
    updatedAt: now,
  };
}

/** "Accept": every optional category ON. */
export function acceptAll(now: string): ConsentDecision {
  return makeDecision({ analytics: true, advertising: true }, now);
}

/** "Reject optional": every optional category OFF (necessary still runs). */
export function rejectOptional(now: string): ConsentDecision {
  return makeDecision({ analytics: false, advertising: false }, now);
}

/** Serialize a decision for storage (the cookie value, before URL-encoding). */
export function encodeConsent(decision: ConsentDecision): string {
  return JSON.stringify(decision);
}

/**
 * Parse a stored cookie value back into a consent state. Returns `null` (which
 * reads as "everything off, ask again") for anything we cannot fully trust: a
 * missing value, malformed JSON, the wrong shape, or a stale schema version. Fails
 * safe by design, so a corrupt or outdated cookie can never leave a category ON.
 */
export function parseConsentCookie(raw: string | undefined | null): ConsentState {
  if (!raw) return null;
  let decoded: string;
  try {
    // Cookie values are URL-encoded when written; tolerate a raw value too.
    decoded = raw.includes("%") ? decodeURIComponent(raw) : raw;
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== CONSENT_VERSION) return null;
  if (typeof obj.analytics !== "boolean" || typeof obj.advertising !== "boolean") return null;
  if (typeof obj.updatedAt !== "string") return null;
  return {
    version: CONSENT_VERSION,
    analytics: obj.analytics,
    advertising: obj.advertising,
    updatedAt: obj.updatedAt,
  };
}

/**
 * Should analytics actually load / record right now? True only when analytics is
 * both configured on (env) AND consented to. `config` is the minimal shape from
 * getAnalyticsConfig(); passing just `{ enabled }` keeps this decoupled and
 * trivially testable.
 */
export function shouldLoadAnalytics(state: ConsentState, config: { enabled: boolean }): boolean {
  return config.enabled && isCategoryGranted(state, "analytics");
}

/**
 * Should advertising actually load right now? True only when ads are both
 * configured on (env) AND consented to. The per-parent free-vs-paid gate
 * (shouldShowAds in lib/ads.ts) is applied on top of this at the ad slot; this
 * function is only the consent dimension.
 */
export function shouldLoadAds(state: ConsentState, config: { enabled: boolean }): boolean {
  return config.enabled && isCategoryGranted(state, "advertising");
}
