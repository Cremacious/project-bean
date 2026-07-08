// lib/children-actions.ts
"use server";
import { and, eq } from "drizzle-orm";
import { getParent } from "@/lib/session";
import { db } from "@/db/client";
import { child } from "@/db/schema";

const MODES = ["read_to_me", "can_read"];

export async function createChild(name: string, readingMode: string): Promise<{ ok: boolean; id?: number }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  const clean = name.trim();
  if (!clean || clean.length > 40 || !MODES.includes(readingMode)) return { ok: false };
  const [row] = await db.insert(child).values({ parentId: parent.id, name: clean, readingMode }).returning({ id: child.id });
  return { ok: true, id: row.id };
}

export async function updateChild(childId: number, name: string, readingMode: string): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  const clean = name.trim();
  if (!clean || clean.length > 40 || !MODES.includes(readingMode)) return { ok: false };
  await db.update(child).set({ name: clean, readingMode }).where(and(eq(child.id, childId), eq(child.parentId, parent.id)));
  return { ok: true };
}

export async function removeChild(childId: number): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  await db.delete(child).where(and(eq(child.id, childId), eq(child.parentId, parent.id)));
  return { ok: true };
}
