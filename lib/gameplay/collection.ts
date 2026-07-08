// lib/gameplay/collection.ts
import { eq, inArray, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, endingFound } from "@/db/schema";
import { computeStoryProgress, deriveBadges, type Badge } from "@/lib/gameplay/progress";

export type CollectionStory = { slug: string; title: string; ageBand: string | null; goodFound: number; goodTotal: number; complete: boolean; surprises: number };
export type Collection = { stats: { endingsFound: number; storiesCompleted: number; surprises: number }; stories: CollectionStory[]; badges: Badge[] };

type StoryRow = { id: number; slug: string; title: string; ageBand: string | null };
type EndingRow = { id: number; storyId: number; endingType: string; isEnding: boolean };

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
    out.push({ slug: s.slug, title: s.title, ageBand: s.ageBand, ...prog });
    endingsFound += prog.goodFound;
    if (prog.complete) storiesCompleted += 1;
    surprises += prog.surprises;
  }
  const badges = deriveBadges({ goodEndingsFound: endingsFound, storiesCompleted, storiesTotal: stories.length, surprisesFound: surprises });
  return { stats: { endingsFound, storiesCompleted, surprises }, stories: out, badges };
}

export async function getCollection(childId: number): Promise<Collection> {
  const stories = await db.select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand }).from(story).orderBy(asc(story.title));
  const ids = stories.map((s) => s.id);
  const endingPages = ids.length
    ? await db.select({ id: page.id, storyId: page.storyId, endingType: page.endingType, isEnding: page.isEnding }).from(page).where(inArray(page.storyId, ids))
    : [];
  const found = await db.select({ pageId: endingFound.pageId }).from(endingFound).where(eq(endingFound.childId, childId));
  return buildCollection(stories, endingPages, found.map((f) => f.pageId));
}
