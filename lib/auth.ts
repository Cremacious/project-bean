// lib/auth.ts
// Minimal single-credential auth for a private, single-reader site.
// Credentials live in .env.local (AUTH_USERNAME / AUTH_PASSWORD). On success we
// issue a signed, httpOnly session cookie (HMAC-SHA256 with SESSION_SECRET) so
// the session cannot be forged. No database-backed accounts.
import crypto from "node:crypto";

export const SESSION_COOKIE = "story_session";

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** True if the supplied credentials match the ones configured in the environment. */
export function verifyCredentials(username: string, password: string): boolean {
  const u = process.env.AUTH_USERNAME ?? "";
  const p = process.env.AUTH_PASSWORD ?? "";
  if (!u || !p) return false;
  // Evaluate both comparisons to avoid short-circuit timing leaks.
  const okUser = safeEqual(username, u);
  const okPass = safeEqual(password, p);
  return okUser && okPass;
}

/** Produce a signed session token carrying the reader's username. */
export function signSession(username: string): string {
  const payload = Buffer.from(JSON.stringify({ u: username })).toString("base64url");
  const sig = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify a session token; returns the username it carries, or null if invalid. */
export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u?: unknown };
    return typeof data.u === "string" ? data.u : null;
  } catch {
    return null;
  }
}
