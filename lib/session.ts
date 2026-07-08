// lib/session.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type Parent = { id: string; name: string; email: string };

/** The signed-in parent, or null. Safe in Server Components. */
export async function getParent(): Promise<Parent | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) return null;
  return { id: s.user.id, name: s.user.name, email: s.user.email };
}
