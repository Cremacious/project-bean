// lib/admin-auth.ts
//
// The pure, framework-free core of the /admin gate (issue #85). Kept free of any
// next/headers or database imports so every rule here is unit-testable in
// isolation (see lib/admin-auth.test.ts). The cookie read/write wrapper that
// touches next/headers lives in lib/admin-session.ts; the login/logout server
// actions live in lib/admin-auth-actions.ts.
//
// Access to /admin requires BOTH:
//   1. the submitted email is on the ADMIN_EMAILS allowlist (isAdmin), AND
//   2. the submitted password equals ADMIN_PASSWORD, compared in constant time.
// On success we mint a short-lived HMAC-signed session token (signed with the
// already-required BETTER_AUTH_SECRET) that guards later admin requests. This is
// a separate identity from a signed-in parent: an admin need not be a parent.
//
// Fail safe everywhere: a missing ADMIN_PASSWORD, a missing BETTER_AUTH_SECRET,
// an empty allowlist, a tampered/expired token, or an email later removed from
// ADMIN_EMAILS all resolve to "denied", never "allowed".
import { createHmac, timingSafeEqual } from "node:crypto";
import { isAdmin } from "@/lib/admin";

/** Name of the admin session cookie. Scoped to /admin (see lib/admin-session.ts). */
export const ADMIN_COOKIE = "bq_admin";

/** Admin session lifetime: 12 hours, then a fresh login is required. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

/**
 * Constant-time string comparison that never short-circuits on the first
 * differing byte. Unequal lengths still burn a comparison before returning
 * false, so neither the value nor its length leaks through timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // timingSafeEqual throws on a length mismatch; compare the buffer with
    // itself to spend comparable time, then report the (real) mismatch.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/**
 * True only if the email is allowlisted AND the password matches ADMIN_PASSWORD.
 * Denies when ADMIN_PASSWORD is unset or blank (fail safe: a misconfigured
 * environment must never leave the panel open).
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false; // no password configured -> deny
  // Check the allowlist first, but still run the constant-time compare so a
  // wrong email and a wrong password are indistinguishable by timing.
  const emailOk = isAdmin(email);
  const passwordOk = constantTimeEqual(password, expected);
  return emailOk && passwordOk;
}

function adminSecret(): string {
  return process.env.BETTER_AUTH_SECRET ?? "";
}

/**
 * Mint a signed admin session token for an allowlisted email that expires at
 * `expiresAtSec` (unix seconds). Shape: `<base64url(payload)>.<base64url(hmac)>`
 * where payload is `email|expiresAtSec`. Returns "" when no secret is configured
 * (the token would be unverifiable anyway).
 */
export function signAdminToken(email: string, expiresAtSec: number): string {
  const secret = adminSecret();
  if (!secret) return "";
  const payload = `${email.trim().toLowerCase()}|${expiresAtSec}`;
  const p = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(p).digest("base64url");
  return `${p}.${sig}`;
}

/**
 * Verify a token and return the admin email it was minted for, or null. Denies
 * when: no secret is configured, the token is malformed, the signature does not
 * match (constant-time), the token has expired, or the email is no longer on the
 * ADMIN_EMAILS allowlist (so removing an admin revokes their live sessions).
 */
export function verifyAdminToken(token: string | undefined | null, nowSec: number): string | null {
  const secret = adminSecret();
  if (!secret || !token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const p = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(p).digest("base64url");
  if (!constantTimeEqual(sig, expected)) return null;
  let payload: string;
  try {
    payload = Buffer.from(p, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const bar = payload.lastIndexOf("|");
  if (bar <= 0) return null;
  const email = payload.slice(0, bar);
  const exp = Number(payload.slice(bar + 1));
  if (!email || !Number.isFinite(exp)) return null;
  if (nowSec >= exp) return null; // expired
  if (!isAdmin(email)) return null; // no longer allowlisted -> revoke
  return email;
}
