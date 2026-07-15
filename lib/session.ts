// lib/session.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type Parent = { id: string; email: string };

/** The signed-in parent, or null. Safe in Server Components. Identity is the
 *  email address: we no longer collect or surface a display name. */
export async function getParent(): Promise<Parent | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) return null;
  return { id: s.user.id, email: s.user.email };
}
