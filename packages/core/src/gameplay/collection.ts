// packages/core/src/gameplay/collection.ts
//
// Pure collection builder. The platform loads published stories, their ending
// pages, and the child's found endings, then hands the flat rows here. No DB
// import lives in core; the web loader (lib/gameplay/collection.ts) wraps this.
import { computeStoryProgress, deriveBadges, type Badge } from "./progress";

export type CollectionStory = { slug: string; title: string; ageBand: string | null; coverImageUrl: string | null; coverMotif: string | null; goodFound: number; goodTotal: number; complete: boolean; surprises: number };
export type Collection = { stats: { endingsFound: number; storiesCompleted: number; surprises: number }; stories: CollectionStory[]; badges: Badge[] };

export type StoryRow = { id: number; slug: string; title: string; ageBand: string | null; coverImageUrl: string | null; coverMotif: string | null };
export type EndingRow = { id: number; storyId: number; endingType: string; isEnding: boolean };

export function buildCollection(stories: StoryRow[], endingPages: EndingRow[], foundIds: number[]): Collection {
  const byStory = new Map<number, { pageId: number; endingType: string }[]>();
  for (const p of endingPages) {
    if (!p.isEnding) continue;
    const arr = byStory.get(p.storyId) ?? [];
    arr.push({ pageId: p.id, endingType: p.endingType });
    byStory.set(p.storyId, arr);
  }
  const out: CollectionStory[] = [];
  let endingsFound = 0, storiesCompleted = 0, surprises = 0;
  for (const s of stories) {
    const prog = computeStoryProgress(byStory.get(s.id) ?? [], foundIds);
    out.push({ slug: s.slug, title: s.title, ageBand: s.ageBand, coverImageUrl: s.coverImageUrl, coverMotif: s.coverMotif, ...prog });
    endingsFound += prog.goodFound;
    if (prog.complete) storiesCompleted += 1;
    surprises += prog.surprises;
  }
  const badges = deriveBadges({ goodEndingsFound: endingsFound, storiesCompleted, storiesTotal: stories.length, surprisesFound: surprises });
  return { stats: { endingsFound, storiesCompleted, surprises }, stories: out, badges };
}
