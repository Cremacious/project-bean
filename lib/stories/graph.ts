// lib/stories/graph.ts
//
// Web data-access layer for the story graph. The pure model + builder now live in
// @bedtime-quests/core; this file adds the Drizzle/Neon loaders and re-exports the
// core pieces so existing web imports of `@/lib/stories/graph` keep working.
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { page as pageTable, choice as choiceTable, endingFound } from "@/db/schema";
import { buildStoryGraph } from "@bedtime-quests/core/stories/graph";

export {
  buildStoryGraph,
  type PageRow,
  type ChoiceRow,
  type GraphChoice,
  type GraphPage,
  type StoryGraph,
} from "@bedtime-quests/core/stories/graph";

/** Load a story's full graph from the DB. */
export async function loadStoryGraph(storyId: number) {
  const pages = await db
    .select({
      id: pageTable.id,
      key: pageTable.key,
      body: pageTable.body,
      isEnding: pageTable.isEnding,
      endingLabel: pageTable.endingLabel,
      endingType: pageTable.endingType,
      imageUrl: pageTable.imageUrl,
    })
    .from(pageTable)
    .where(eq(pageTable.storyId, storyId));

  const pageIds = pages.map((p) => p.id);
  const choices =
    pageIds.length === 0
      ? []
      : await db
          .select({
            pageId: choiceTable.pageId,
            toPageKey: choiceTable.toPageKey,
            label: choiceTable.label,
            order: choiceTable.order,
          })
          .from(choiceTable);

  // Filter choices to this story's pages (choices table has no storyId).
  const idSet = new Set(pageIds);
  return buildStoryGraph(pages, choices.filter((c) => idSet.has(c.pageId)));
}

/** How many distinct endings this child has found in this story. */
export async function countEndingsFound(childId: number, storyId: number): Promise<number> {
  const rows = await db
    .select({ pageId: endingFound.pageId })
    .from(endingFound)
    .where(and(eq(endingFound.childId, childId), eq(endingFound.storyId, storyId)));
  return rows.length;
}

/** All ending pages for a story, with their kind (good/game_over). */
export async function loadStoryEndings(storyId: number): Promise<{ pageId: number; endingType: string }[]> {
  const rows = await db
    .select({ pageId: pageTable.id, endingType: pageTable.endingType })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, storyId), eq(pageTable.isEnding, true)));
  return rows;
}
