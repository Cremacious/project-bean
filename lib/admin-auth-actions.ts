"use server";
//
// lib/admin-auth-actions.ts
//
// The login and logout server actions behind the /admin gate (issue #85).
// Security notes:
//  - Server Actions are reachable by a direct POST, so credentials are verified
//    here on the server (verifyAdminCredentials), never trusted from the client.
//  - The compare is constant-time and requires BOTH an allowlisted email and the
//    ADMIN_PASSWORD (see lib/admin-auth.ts). We fail safe: any problem denies.
//  - A best-effort in-memory throttle slows password guessing. It is per-process
//    (fine for the single long-lived server this runs on); a shared store is the
//    upgrade path if ever deployed across instances, mirroring lib/auth.ts.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminCredentials } from "@/lib/admin-auth";
import { setAdminSession, clearAdminSession } from "@/lib/admin-session";
import type { AdminLoginState } from "@/lib/admin-auth-state";

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

/** True if this key has exhausted its attempts inside the current window. */
function isThrottled(key: string, now: number): boolean {
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string, now: number): void {
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown").toLowerCase();
}

const DENIED = "Those credentials were not recognized.";

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = (formData.get("email") ?? "").toString();
  const password = (formData.get("password") ?? "").toString();

  const key = await clientKey();
  const now = Date.now();
  if (isThrottled(key, now)) {
    return { status: "error", message: "Too many attempts. Please wait a minute and try again." };
  }

  if (!verifyAdminCredentials(email, password)) {
    recordFailure(key, now);
    return { status: "error", message: DENIED };
  }

  attempts.delete(key); // success clears the throttle
  await setAdminSession(email.trim().toLowerCase());
  redirect("/admin"); // outside any try/catch: redirect throws by design
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin");
}
