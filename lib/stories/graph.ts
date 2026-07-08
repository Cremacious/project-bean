// lib/stories/graph.ts
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { page as pageTable, choice as choiceTable, endingFound } from "@/db/schema";

export type PageRow = {
  id: number;
  key: string;
  body: string;
  isEnding: boolean;
  endingLabel: string | null;
  imageUrl: string | null;
};

export type ChoiceRow = {
  pageId: number;
  toPageKey: string;
  label: string;
  order: number;
};

export type GraphChoice = { label: string; to: string };

export type GraphPage = {
  id: number;
  key: string;
  body: string;
  imageUrl: string | null;
  isEnding: boolean;
  endingLabel: string | null;
  choices: GraphChoice[];
};

export type StoryGraph = {
  pages: Record<string, GraphPage>;
  totalEndings: number;
};

/** Pure: turn flat page/choice rows into a keyed graph. */
export function buildStoryGraph(pages: PageRow[], choices: ChoiceRow[]): StoryGraph {
  const byId = new Map<number, GraphPage>();
  const graph: StoryGraph = { pages: {}, totalEndings: 0 };

  for (const p of pages) {
    const gp: GraphPage = {
      id: p.id,
      key: p.key,
      body: p.body,
      imageUrl: p.imageUrl,
      isEnding: p.isEnding,
      endingLabel: p.endingLabel,
      choices: [],
    };
    graph.pages[p.key] = gp;
    byId.set(p.id, gp);
    if (p.isEnding) graph.totalEndings += 1;
  }

  const sorted = [...choices].sort((a, b) => a.order - b.order);
  for (const c of sorted) {
    const from = byId.get(c.pageId);
    if (from) from.choices.push({ label: c.label, to: c.toPageKey });
  }

  return graph;
}

/** Load a story's full graph from the DB. */
export async function loadStoryGraph(storyId: number): Promise<StoryGraph> {
  const pages = await db
    .select({
      id: pageTable.id,
      key: pageTable.key,
      body: pageTable.body,
      isEnding: pageTable.isEnding,
      endingLabel: pageTable.endingLabel,
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

/** How many distinct endings this reader has found in this story. */
export async function countEndingsFound(readerId: string, storyId: number): Promise<number> {
  const rows = await db
    .select({ pageId: endingFound.pageId })
    .from(endingFound)
    .where(and(eq(endingFound.readerId, readerId), eq(endingFound.storyId, storyId)));
  return rows.length;
}
