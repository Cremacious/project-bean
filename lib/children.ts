// lib/children.ts
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { child } from "@/db/schema";

export type Child = {
  id: number; name: string; readingMode: string;
  readerFont: string; readerFontSize: string;
};

export async function listChildren(parentId: string): Promise<Child[]> {
  return db
    .select({ id: child.id, name: child.name, readingMode: child.readingMode, readerFont: child.readerFont, readerFontSize: child.readerFontSize })
    .from(child)
    .where(eq(child.parentId, parentId))
    .orderBy(asc(child.createdAt));
}

export async function getChildForParent(parentId: string, childId: number): Promise<Child | null> {
  const [row] = await db
    .select({ id: child.id, name: child.name, readingMode: child.readingMode, readerFont: child.readerFont, readerFontSize: child.readerFontSize })
    .from(child)
    .where(and(eq(child.id, childId), eq(child.parentId, parentId)))
    .limit(1);
  return row ?? null;
}
