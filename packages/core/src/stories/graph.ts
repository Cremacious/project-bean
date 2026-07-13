// packages/core/src/stories/graph.ts
//
// Pure story-graph model and builder. No I/O: the platform (web Drizzle loader,
// or a future native data source) fetches flat page/choice rows and hands them to
// buildStoryGraph. Keeping this free of DB imports is what lets both the web app
// and the Expo app share one story engine.

export type PageRow = {
  id: number;
  key: string;
  body: string;
  isEnding: boolean;
  endingLabel: string | null;
  endingType: string;
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
  endingType: string;
  choices: GraphChoice[];
};

export type StoryGraph = {
  pages: Record<string, GraphPage>;
  totalEndings: number;
  goodEndings: number;
};

/** Pure: turn flat page/choice rows into a keyed graph. */
export function buildStoryGraph(pages: PageRow[], choices: ChoiceRow[]): StoryGraph {
  const byId = new Map<number, GraphPage>();
  const graph: StoryGraph = { pages: {}, totalEndings: 0, goodEndings: 0 };

  for (const p of pages) {
    const gp: GraphPage = {
      id: p.id,
      key: p.key,
      body: p.body,
      imageUrl: p.imageUrl,
      isEnding: p.isEnding,
      endingLabel: p.endingLabel,
      endingType: p.endingType,
      choices: [],
    };
    graph.pages[p.key] = gp;
    byId.set(p.id, gp);
    if (p.isEnding) graph.totalEndings += 1;
    if (p.isEnding && p.endingType === "good") graph.goodEndings += 1;
  }

  const sorted = [...choices].sort((a, b) => a.order - b.order);
  for (const c of sorted) {
    const from = byId.get(c.pageId);
    if (from) from.choices.push({ label: c.label, to: c.toPageKey });
  }

  return graph;
}
