// lib/admin-session.ts
//
// Server-only glue between the pure admin gate (lib/admin-auth.ts) and Next's
// cookie store (issue #85). This is the ONLY place the admin session cookie is
// read, set, or cleared. Every admin route and every admin server action calls
// getAdminEmail()/requireAdminEmail() here so the gate is enforced server-side,
// not just by hiding UI.
import "server-only";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  signAdminToken,
  verifyAdminToken,
} from "@/lib/admin-auth";

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

/** The verified admin email from the session cookie, or null if not signed in. */
export async function getAdminEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, nowSec());
}

/** True when the current request carries a valid admin session. */
export async function isAdminRequest(): Promise<boolean> {
  return (await getAdminEmail()) !== null;
}

/**
 * The admin email for the current request, or throw. Server actions call this
 * before doing anything sensitive: a direct POST to an action bypasses the
 * layout gate, so each action must re-check the session itself.
 */
export async function requireAdminEmail(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) throw new Error("Not allowed");
  return email;
}

/** Establish an admin session for an allowlisted email. Call only after
 *  verifyAdminCredentials has passed. */
export async function setAdminSession(email: string): Promise<void> {
  const token = signAdminToken(email, nowSec() + ADMIN_SESSION_TTL_SECONDS);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

/** Clear the admin session (sign out). */
export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
}
