// lib/gameplay/collection.ts
//
// Web data-access layer for the collection screen. The pure builder lives in
// @bedtime-quests/core; this file loads the rows via Drizzle and re-exports the
// core pieces so existing web imports of `@/lib/gameplay/collection` keep working.
import { eq, inArray, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, endingFound } from "@/db/schema";
import { buildCollection } from "@bedtime-quests/core/gameplay/collection";

export {
  buildCollection,
  type Collection,
  type CollectionStory,
} from "@bedtime-quests/core/gameplay/collection";

export async function getCollection(childId: number) {
  const stories = await db
    .select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand, coverImageUrl: story.coverImageUrl, coverMotif: story.coverMotif })
    .from(story).where(eq(story.published, true)).orderBy(asc(story.title));
  const ids = stories.map((s) => s.id);
  const endingPages = ids.length
    ? await db.select({ id: page.id, storyId: page.storyId, endingType: page.endingType, isEnding: page.isEnding }).from(page).where(inArray(page.storyId, ids))
    : [];
  const found = await db.select({ pageId: endingFound.pageId }).from(endingFound).where(eq(endingFound.childId, childId));
  return buildCollection(stories, endingPages, found.map((f) => f.pageId));
}
