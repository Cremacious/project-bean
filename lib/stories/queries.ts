// lib/stories/queries.ts
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story } from "@/db/schema";

export type StoryCard = { id: number; slug: string; title: string; description: string; ageBand: string | null; coverImageUrl: string | null; coverMotif: string | null; premium: boolean; createdAt: Date };

/** All PUBLISHED stories, optionally filtered by age band. `createdAt` drives the
 * "New" badge for recently published stories (issue #74, isNewStory in core). */
export async function getCatalog(ageBand?: string): Promise<StoryCard[]> {
  const cols = { id: story.id, slug: story.slug, title: story.title, description: story.description, ageBand: story.ageBand, coverImageUrl: story.coverImageUrl, coverMotif: story.coverMotif, premium: story.premium, createdAt: story.createdAt };
  const where = ageBand ? and(eq(story.published, true), eq(story.ageBand, ageBand)) : eq(story.published, true);
  return db.select(cols).from(story).where(where).orderBy(asc(story.title));
}

/** A PUBLISHED story by slug (public reader path), or null. `premium` drives the paywall gate (#34). */
export async function getStoryBySlug(slug: string) {
  const [row] = await db
    .select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand, startPageId: story.startPageId, premium: story.premium })
    .from(story).where(and(eq(story.slug, slug), eq(story.published, true))).limit(1);
  return row ?? null;
}
