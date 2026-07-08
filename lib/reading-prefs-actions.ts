// lib/reading-prefs-actions.ts
"use server";

import { eq } from "drizzle-orm";
import { getReader } from "@/lib/session";
import { isFontId, isSizeId } from "@/lib/reading-prefs";
import { db } from "@/db/client";
import { user } from "@/db/schema";

export async function setReadingPrefs(font: string, size: string): Promise<{ ok: boolean }> {
  if (!isFontId(font) || !isSizeId(size)) return { ok: false };
  const reader = await getReader();
  if (!reader) return { ok: false };
  await db.update(user).set({ readerFont: font, readerFontSize: size }).where(eq(user.id, reader.id));
  return { ok: true };
}
