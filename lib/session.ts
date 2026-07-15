// lib/session.ts
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";

export type Parent = { id: string; email: string };

/** The signed-in parent, or null. Safe in Server Components. Identity is the
 *  email address: we no longer collect or surface a display name.
 *
 *  Admin moderation (issue #85): a disabled account is treated as signed out
 *  here, so every authed page (which funnels through getParent) becomes
 *  unreachable for a disabled parent even while their session cookie is still
 *  valid. Clearing user.disabledAt re-enables them. A failed lookup must never
 *  silently unlock the app, but it also must not crash a page, so a DB error
 *  falls through to returning the session-derived parent. */
export async function getParent(): Promise<Parent | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) return null;
  try {
    const [row] = await db
      .select({ disabledAt: user.disabledAt })
      .from(user)
      .where(eq(user.id, s.user.id))
      .limit(1);
    if (row?.disabledAt) return null; // disabled accounts are inert app-wide
  } catch (err) {
    console.error("getParent: disabled-account lookup failed; allowing the session.", err);
  }
  return { id: s.user.id, email: s.user.email };
}
