// lib/stories/actions.ts
"use server";

import { getReader } from "@/lib/session";
import { getAccessibleStoryBySlug } from "@/lib/stories/queries";
import { countEndingsFound } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable, endingFound } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Records that the signed-in reader reached the given ending page.
 * Returns updated progress. Ignores non-ending pages and inaccessible stories.
 */
export async function recordEnding(
  slug: string,
  pageKey: string,
): Promise<{ found: number; total: number } | null> {
  const reader = await getReader();
  if (!reader) return null;

  const story = await getAccessibleStoryBySlug(reader.id, slug);
  if (!story) return null;

  const [pageRow] = await db
    .select({ id: pageTable.id, isEnding: pageTable.isEnding })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.key, pageKey)))
    .limit(1);

  if (!pageRow || !pageRow.isEnding) return null;

  await db
    .insert(endingFound)
    .values({ readerId: reader.id, storyId: story.id, pageId: pageRow.id })
    .onConflictDoNothing();

  const found = await countEndingsFound(reader.id, story.id);

  const endings = await db
    .select({ id: pageTable.id })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.isEnding, true)));

  return { found, total: endings.length };
}
