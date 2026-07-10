// lib/admin/queries.ts
import { eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";

export type AdminStoryListItem = { id: number; slug: string; title: string; ageBand: string | null; published: boolean; coverImageUrl: string | null; coverMotif: string | null };

export async function listAdminStories(): Promise<AdminStoryListItem[]> {
  return db
    .select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand, published: story.published, coverImageUrl: story.coverImageUrl, coverMotif: story.coverMotif })
    .from(story).orderBy(asc(story.title));
}

export type AdminStory = typeof story.$inferSelect;
export type AdminPage = typeof page.$inferSelect;
export type AdminChoice = typeof choice.$inferSelect;

export async function getAdminStory(slug: string): Promise<AdminStory | null> {
  const [row] = await db.select().from(story).where(eq(story.slug, slug)).limit(1);
  return row ?? null;
}

export async function listPages(storyId: number): Promise<AdminPage[]> {
  return db.select().from(page).where(eq(page.storyId, storyId)).orderBy(asc(page.id));
}

export async function listChoices(storyId: number): Promise<AdminChoice[]> {
  const pages = await db.select({ id: page.id }).from(page).where(eq(page.storyId, storyId));
  const ids = new Set(pages.map((p) => p.id));
  if (ids.size === 0) return [];
  const all = await db.select().from(choice).orderBy(asc(choice.order));
  return all.filter((c) => ids.has(c.pageId));
}
