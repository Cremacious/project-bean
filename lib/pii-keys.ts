// lib/pii-keys.ts
//
// The ONE denylist of field-name segments that mark data as personal, shared by
// every privacy-safe data path (analytics in lib/analytics.ts, crash reporting in
// lib/reporting.ts). Single-sourced on purpose: a child-directed app must scrub
// the SAME set of personal fields everywhere, so this list cannot be allowed to
// drift between features (docs/COMPLIANCE-COPPA.md sections 2 and 6).

// Key segments that mark a field as personal and must never leave the app.
// Matched against the key's lowercased segments (split on non-alphanumerics and
// camelCase), so "childName" -> ["child","name"] is caught while an innocuous
// key like "recipe" (segment "recipe") is not a false positive.
const DENIED_KEY_SEGMENTS: ReadonlySet<string> = new Set([
  "name",
  "firstname",
  "lastname",
  "email",
  "child",
  "kid",
  "parent",
  "user",
  "userid",
  "uid",
  "account",
  "session",
  "ip",
  "token",
  "password",
  "secret",
  "phone",
  "address",
]);

/** Split a field key into lowercased segments for the personal-key check. */
function keySegments(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camelCase boundary
    .split(/[^a-zA-Z0-9]+/) // snake_case, kebab, spaces
    .map((s) => s.toLowerCase())
    .filter(Boolean);
}

/** True when a field key looks like it could carry personal data. */
export function isPersonalKey(key: string): boolean {
  return keySegments(key).some((seg) => DENIED_KEY_SEGMENTS.has(seg));
}
