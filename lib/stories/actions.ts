// lib/stories/actions.ts
"use server";

import { and, eq } from "drizzle-orm";
import { getActiveChild } from "@/lib/active-child";
import { getStoryBySlug } from "@/lib/stories/queries";
import { countEndingsFound } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable, endingFound } from "@/db/schema";

/**
 * Records that the active child reached the given ending page.
 * Returns updated progress. Ignores non-ending pages and unknown stories.
 */
export async function recordEnding(slug: string, pageKey: string): Promise<{ found: number; total: number } | null> {
  const child = await getActiveChild();
  if (!child) return null;
  const story = await getStoryBySlug(slug);
  if (!story) return null;

  const [pageRow] = await db
    .select({ id: pageTable.id, isEnding: pageTable.isEnding })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.key, pageKey)))
    .limit(1);
  if (!pageRow || !pageRow.isEnding) return null;

  await db.insert(endingFound)
    .values({ childId: child.id, storyId: story.id, pageId: pageRow.id })
    .onConflictDoNothing();

  const found = await countEndingsFound(child.id, story.id);
  const endings = await db.select({ id: pageTable.id }).from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.isEnding, true)));
  return { found, total: endings.length };
}
