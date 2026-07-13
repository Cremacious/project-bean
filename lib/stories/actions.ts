// lib/stories/actions.ts
"use server";

import { and, eq } from "drizzle-orm";
import { getActiveChild } from "@/lib/active-child";
import { getStoryBySlug } from "@/lib/stories/queries";
import { loadStoryEndings } from "@/lib/stories/graph";
import { computeStoryProgress, type StoryProgress } from "@bedtime-quests/core/gameplay/progress";
import { db } from "@/db/client";
import { page as pageTable, endingFound } from "@/db/schema";

/**
 * Records that the active child reached the given ending page.
 * Returns the ending's kind plus updated good-ending progress.
 * Ignores non-ending pages and unknown stories.
 */
export async function recordEnding(
  slug: string,
  pageKey: string,
): Promise<({ endingType: string } & StoryProgress) | null> {
  const child = await getActiveChild();
  if (!child) return null;
  const story = await getStoryBySlug(slug);
  if (!story) return null;

  const [pageRow] = await db
    .select({ id: pageTable.id, isEnding: pageTable.isEnding, endingType: pageTable.endingType })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.key, pageKey)))
    .limit(1);
  if (!pageRow || !pageRow.isEnding) return null;

  await db.insert(endingFound)
    .values({ childId: child.id, storyId: story.id, pageId: pageRow.id })
    .onConflictDoNothing();

  const endings = await loadStoryEndings(story.id);
  const found = await db
    .select({ pageId: endingFound.pageId })
    .from(endingFound)
    .where(and(eq(endingFound.childId, child.id), eq(endingFound.storyId, story.id)));
  const foundPageIds = found.map((f) => f.pageId);

  return { endingType: pageRow.endingType, ...computeStoryProgress(endings, foundPageIds) };
}
