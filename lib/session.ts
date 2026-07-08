// lib/session.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type Reader = {
  id: string;
  username: string;
  displayName: string;
  theme: string;
};

/** Returns the signed-in reader, or null. Safe to call in Server Components. */
export async function getReader(): Promise<Reader | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as unknown as Reader & Record<string, unknown>;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    theme: u.theme ?? "cozy",
  };
}
