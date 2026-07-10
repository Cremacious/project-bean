// lib/reporting.ts
//
// Privacy-safe crash and error reporting for a CHILD-DIRECTED app (issue #39).
//
// Compliance posture (docs/COMPLIANCE-COPPA.md sections 2, 6, 7): an error
// payload must never carry personal data. NO child first name, NO parent email,
// NO user/session id that maps to a person, NO request body or query string that
// could contain the {{name}} personalization. Three guarantees enforce that:
//   1. Sentry runs with sendDefaultPii OFF, so it never auto-attaches IPs,
//      cookies, or user identity.
//   2. Every event passes through scrubEvent() (wired as Sentry `beforeSend`),
//      which strips personal-looking keys, request bodies, cookies, query
//      strings, and any email-shaped string, as defense in depth.
//   3. The app never attaches the child name, parent email, or a personal id to
//      an event in the first place (no Sentry.setUser with identity, no name in
//      error messages; see the story reader, which passes the name only as a
//      render prop, never into a thrown error).
//
// Provider-agnostic and config-gated by design (mirrors lib/analytics.ts and
// lib/ads.ts): reporting is wired through Sentry but stays fully OFF whenever its
// DSN is absent, so local dev and CI run clean with no reporting and no network
// calls. A single kill switch (NEXT_PUBLIC_SENTRY_ENABLED) turns it off
// everywhere while keeping the DSN in place.

import { isPersonalKey } from "./pii-keys";

/**
 * Resolved reporting config. `enabled` is the one honest boolean the whole app
 * asks; everything else is what Sentry needs to initialize. Enabled requires a
 * DSN AND the kill switch not being flipped off, so with no DSN reporting is
 * simply off.
 */
export type ReportingConfig = {
  /** Effective on/off: DSN present AND kill switch not tripped. */
  enabled: boolean;
  /** The Sentry DSN, or null when unset. Public by design (shipped in the client bundle). */
  dsn: string | null;
  /** Environment tag so prod errors are told apart from dev (issue #39 req 5). */
  environment: string;
  /** Optional release/version for grouping. Undefined when unset (do not block on it). */
  release: string | undefined;
};

/**
 * A kill switch: on by default, OFF only when explicitly "false" or "0". Anything
 * else (including blank or absent) leaves it on, so it is a true global disable
 * that takes a deliberate value to trip. (Matches lib/analytics.ts.)
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
 * Resolve the reporting config from the environment (injectable for tests).
 *
 * Enabled requires BOTH a DSN AND the kill switch (NEXT_PUBLIC_SENTRY_ENABLED)
 * not being flipped off. The kill switch defaults ON when a DSN is present, so
 * setting it to "false" is a one-line global disable that keeps the DSN in place.
 * With no DSN, reporting is off: local dev and CI initialize nothing and make no
 * reporting network calls.
 */
export function getReportingConfig(env: NodeJS.ProcessEnv = process.env): ReportingConfig {
  const dsn = cleanId(env.NEXT_PUBLIC_SENTRY_DSN);
  const environment =
    cleanId(env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) ?? cleanId(env.NODE_ENV) ?? "development";
  const release = cleanId(env.NEXT_PUBLIC_SENTRY_RELEASE) ?? undefined;
  return {
    enabled: dsn !== null && !isKilled(env.NEXT_PUBLIC_SENTRY_ENABLED),
    dsn,
    environment,
    release,
  };
}

/** Convenience predicate used by the instrumentation hooks. */
export function isReportingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return getReportingConfig(env).enabled;
}

// --- PII scrubbing (beforeSend) -------------------------------------------

/**
 * A loose, structural view of a Sentry event. We only touch the fields that can
 * carry personal data; anything else passes through untouched. Typed locally so
 * this module stays vendor-agnostic and unit-testable without importing the SDK.
 */
export type ReportingEvent = {
  user?: Record<string, unknown> | null;
  request?: {
    url?: string;
    query_string?: unknown;
    data?: unknown;
    cookies?: unknown;
    headers?: Record<string, unknown>;
    method?: string;
    [key: string]: unknown;
  } | null;
  extra?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: Array<Record<string, unknown>>;
  message?: unknown;
  exception?: { values?: Array<{ value?: unknown; [key: string]: unknown }> };
  [key: string]: unknown;
};

// NOTE: not a /g regex. A global regex is stateful across .test()/.replace()
// calls (lastIndex), which caused emails to be missed intermittently. redactEmails
// builds its own global copy per call so this one stays safe to reuse anywhere.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const REDACTED = "[redacted]";

/** Keys whose string value is a URL/path we should strip the query string from. */
const URL_KEYS: ReadonlySet<string> = new Set(["url", "href", "to", "from", "path", "referrer"]);

/**
 * Field names that carry credentials, cookies, or the caller's identity, matched
 * case-insensitively as a whole name. These are dropped in addition to the
 * personal-key denylist (isPersonalKey), which matches by segment. Sentry mirrors
 * request data under both `event.request` and `event.contexts.request`, so this
 * set must be applied everywhere, not just to the top-level request.
 */
const SENSITIVE_HEADERS: ReadonlySet<string> = new Set([
  "cookie",
  "cookies",
  "set-cookie",
  "authorization",
  "proxy-authorization",
  "x-forwarded-for",
  "forwarded",
  "x-real-ip",
]);

/** True when a field must be dropped outright: personal by segment, or a credential/cookie/identity field. */
function isSensitiveKey(key: string): boolean {
  return isPersonalKey(key) || SENSITIVE_HEADERS.has(key.toLowerCase());
}

/** Drop the query string (and fragment) from a URL or path, keeping the route. */
function stripQuery(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

/** Redact any email-shaped substring inside a free-text string (message, stack). */
function redactEmails(text: string): string {
  return text.replace(new RegExp(EMAIL_RE.source, "g"), REDACTED);
}

/**
 * Recursively scrub an arbitrary value: drop personal-looking keys, redact
 * email-shaped strings, and strip query strings from URL-ish keys. Used on the
 * loose bags Sentry attaches (extra, tags, contexts, breadcrumb data).
 */
function deepScrub(value: unknown, keyHint?: string): unknown {
  if (typeof value === "string") {
    const emailless = redactEmails(value);
    return keyHint && URL_KEYS.has(keyHint.toLowerCase()) ? stripQuery(emailless) : emailless;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepScrub(v));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) continue; // drop name/email/child/user/session/cookie/... outright
      out[k] = deepScrub(v, k);
    }
    return out;
  }
  return value;
}

/**
 * Sentry `beforeSend` hook. Runs on EVERY event (auto-captured and manual) and
 * removes anything that could be personal before it leaves the app. Never throws:
 * a scrub failure must not drop the whole reporting pipeline, so on error we fail
 * safe by returning null (the event is dropped rather than sent unscrubbed).
 */
export function scrubEvent<T extends ReportingEvent>(event: T): T | null {
  try {
    // 1. Identity: never send a user object with personal fields. Keep only a
    //    non-identifying opaque id (never an email or a name).
    if (event.user) {
      const id = event.user.id;
      // Keep only a non-identifying opaque id for grouping; never an email, and
      // never the name/ip/username Sentry may also carry.
      const opaqueId = typeof id === "string" && !EMAIL_RE.test(id) ? id : undefined;
      if (opaqueId) event.user = { id: opaqueId };
      else delete event.user;
    }

    // 2. Request: drop the body, cookies, and query string; keep only the route
    //    and method for debugging. The {{name}} personalization can only live in
    //    a body or query, so both go.
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.query_string;
      if (typeof event.request.url === "string") event.request.url = stripQuery(event.request.url);
      if (event.request.headers && typeof event.request.headers === "object") {
        // Drop credential/identity headers by name (case-insensitive) and redact
        // any email in the remaining values. We do NOT apply the personal-key
        // denylist to header names here: standard headers like "user-agent" split
        // to a denied segment ("user") but are benign and useful for debugging.
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(event.request.headers)) {
          if (SENSITIVE_HEADERS.has(key.toLowerCase())) continue;
          cleaned[key] = typeof value === "string" ? redactEmails(value) : deepScrub(value);
        }
        event.request.headers = cleaned;
      }
    }

    // 3. Loose bags Sentry attaches: recursively scrub personal keys + emails.
    if (event.extra) event.extra = deepScrub(event.extra) as Record<string, unknown>;
    if (event.tags) event.tags = deepScrub(event.tags) as Record<string, unknown>;
    if (event.contexts) event.contexts = deepScrub(event.contexts) as Record<string, unknown>;
    if (Array.isArray(event.breadcrumbs)) {
      event.breadcrumbs = event.breadcrumbs.map((b) => deepScrub(b) as Record<string, unknown>);
    }

    // 4. Free text (message + exception values): redact email-shaped substrings.
    //    We cannot generically detect the child first name here, which is exactly
    //    why the app never puts it into an error message in the first place.
    if (typeof event.message === "string") event.message = redactEmails(event.message);
    if (event.exception?.values) {
      for (const v of event.exception.values) {
        if (typeof v.value === "string") v.value = redactEmails(v.value);
      }
    }

    return event;
  } catch {
    return null; // fail safe: never send a possibly-unscrubbed event
  }
}

// --- Manual capture --------------------------------------------------------

/** How a captured error is delivered. Injectable so callers unit-test the gate. */
export type CaptureTransport = (error: unknown) => void | Promise<void>;

/**
 * Default transport: hand the error to Sentry, which is already initialized (and
 * carries the scrubEvent beforeSend). Dynamically imported so this pure module
 * never statically depends on the SDK, and so a build with reporting disabled can
 * tree-shake it away.
 */
const defaultTransport: CaptureTransport = async (error) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error);
};

/**
 * The ONE manual capture entry point, used by the React error boundaries. Errors
 * that hit a Next error boundary are handled by React and never reach the global
 * handlers, so the boundary must report them explicitly.
 *
 * No-ops silently when reporting is disabled (no DSN or kill switch off), and
 * never throws: reporting must never break the app. Scrubbing still happens in
 * Sentry's beforeSend, so this only forwards the error.
 */
export function captureError(
  error: unknown,
  opts: { config?: ReportingConfig; transport?: CaptureTransport } = {},
): void {
  const config = opts.config ?? getReportingConfig();
  if (!config.enabled) return;
  const transport = opts.transport ?? defaultTransport;
  try {
    const result = transport(error);
    if (result instanceof Promise) result.catch(() => {});
  } catch {
    // Swallow: a reporting failure must not take down the error boundary.
  }
}

/**
 * Build the Sentry.init options from resolved config. Central so the client,
 * server, and edge entrypoints stay consistent: PII off, scrubbing on, tracing
 * and Session Replay OFF (replay would record the child's name on screen).
 * Typed loosely to avoid importing the SDK into this pure module.
 */
export function buildSentryOptions(config: ReportingConfig): Record<string, unknown> {
  return {
    dsn: config.dsn ?? undefined,
    environment: config.environment,
    release: config.release,
    // Privacy: never auto-attach IP, cookies, or user identity (issue #39 req 2).
    sendDefaultPii: false,
    // No performance tracing and no Session Replay: we only want crash reports,
    // and replay would capture the personalized story text on screen.
    tracesSampleRate: 0,
    // Final safety net: strip any personal data from every outgoing event.
    beforeSend: scrubEvent,
  };
}
