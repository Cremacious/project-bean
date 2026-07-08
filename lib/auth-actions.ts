// lib/auth-actions.ts
"use server";

import { cookies } from "next/headers";
import { verifyCredentials, signSession, SESSION_COOKIE } from "@/lib/auth";

/** Validate credentials against the environment; on success set the session cookie. */
export async function signInAction(
  username: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!verifyCredentials(username, password)) {
    return { ok: false, error: "Incorrect username or password." };
  }

  const token = signSession(username);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { ok: true };
}

/** Clear the session cookie. */
export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
