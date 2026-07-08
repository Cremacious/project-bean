// lib/stories/queries.ts
import { eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story } from "@/db/schema";

export type StoryCard = { id: number; slug: string; title: string; description: string; ageBand: string | null };

/** All published stories, optionally filtered by age band. */
export async function getCatalog(ageBand?: string): Promise<StoryCard[]> {
  const cols = { id: story.id, slug: story.slug, title: story.title, description: story.description, ageBand: story.ageBand };
  if (ageBand) {
    return db.select(cols).from(story).where(eq(story.ageBand, ageBand)).orderBy(asc(story.title));
  }
  return db.select(cols).from(story).orderBy(asc(story.title));
}

/** A story by slug (global catalog — no access restriction), or null. */
export async function getStoryBySlug(slug: string) {
  const [row] = await db
    .select({ id: story.id, slug: story.slug, title: story.title, startPageId: story.startPageId })
    .from(story).where(eq(story.slug, slug)).limit(1);
  return row ?? null;
}
