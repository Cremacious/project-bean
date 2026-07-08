// lib/session.ts
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";

export type Reader = {
  id: string;
  username: string;
  displayName: string;
  theme: string;
  readerFont: string;
  readerFontSize: string;
};

/**
 * Returns the signed-in reader, or null. Safe to call in Server Components.
 * The session cookie carries the login username, which maps to a reader row.
 */
export async function getReader(): Promise<Reader | null> {
  const jar = await cookies();
  const username = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!username) return null;

  const [row] = await db
    .select({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      theme: user.theme,
      readerFont: user.readerFont,
      readerFontSize: user.readerFontSize,
    })
    .from(user)
    .where(eq(user.username, username))
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    theme: row.theme ?? "cozy",
    readerFont: row.readerFont ?? "rounded",
    readerFontSize: row.readerFontSize ?? "md",
  };
}
