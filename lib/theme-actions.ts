// lib/theme-actions.ts
"use server";

import { getReader } from "@/lib/session";
import { isThemeId } from "@/lib/theme";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Persist the signed-in reader's theme choice. */
export async function setTheme(theme: string): Promise<{ ok: boolean }> {
  if (!isThemeId(theme)) return { ok: false };
  const reader = await getReader();
  if (!reader) return { ok: false };

  await db.update(user).set({ theme, updatedAt: new Date() }).where(eq(user.id, reader.id));
  return { ok: true };
}
