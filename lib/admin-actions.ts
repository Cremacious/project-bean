// lib/admin-actions.ts
"use server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { isValidSlug } from "@/lib/admin/slugs";
import { buildStoryInput } from "@/lib/admin/story-to-input";
import { validateStory } from "@/lib/stories/validate";

async function requireAdmin(): Promise<boolean> {
  const parent = await getParent();
  return !!parent && isAdmin(parent.email);
}

const AGE_BANDS = ["2-4", "5-7", "8+"];
type StoryMeta = { title: string; slug: string; description: string; ageBand: string | null; coverImageUrl: string | null };

export async function createStory(meta: StoryMeta): Promise<{ ok: boolean; slug?: string; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  const title = meta.title.trim();
  const slug = meta.slug.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (!isValidSlug(slug)) return { ok: false, error: "Slug must be lowercase words joined by single hyphens" };
  if (meta.ageBand && !AGE_BANDS.includes(meta.ageBand)) return { ok: false, error: "Invalid age band" };
  const [dupe] = await db.select({ id: story.id }).from(story).where(eq(story.slug, slug)).limit(1);
  if (dupe) return { ok: false, error: "That slug is already taken" };
  await db.insert(story).values({
    slug, title, description: meta.description.trim(), ageBand: meta.ageBand,
    coverImageUrl: meta.coverImageUrl?.trim() || null, published: false,
  });
  return { ok: true, slug };
}

export async function updateStoryMeta(storyId: number, meta: Omit<StoryMeta, "slug">): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  const title = meta.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (meta.ageBand && !AGE_BANDS.includes(meta.ageBand)) return { ok: false, error: "Invalid age band" };
  await db.update(story).set({
    title, description: meta.description.trim(), ageBand: meta.ageBand,
    coverImageUrl: meta.coverImageUrl?.trim() || null, updatedAt: new Date(),
  }).where(eq(story.id, storyId));
  return { ok: true };
}

export async function deleteStory(storyId: number): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  await db.delete(story).where(eq(story.id, storyId)); // pages/choices cascade
  return { ok: true };
}

export async function setStartPage(storyId: number, pageKey: string): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  const [p] = await db.select({ id: page.id }).from(page).where(and(eq(page.storyId, storyId), eq(page.key, pageKey))).limit(1);
  if (!p) return { ok: false };
  await db.update(story).set({ startPageId: p.id, updatedAt: new Date() }).where(eq(story.id, storyId));
  return { ok: true };
}

/** Publish only when valid; unpublish always allowed. Returns validation errors when blocking. */
export async function setPublished(storyId: number, published: boolean): Promise<{ ok: boolean; errors?: string[] }> {
  if (!(await requireAdmin())) return { ok: false };
  if (published) {
    const [s] = await db.select().from(story).where(eq(story.id, storyId)).limit(1);
    if (!s) return { ok: false };
    const pages = await db.select().from(page).where(eq(page.storyId, storyId));
    const pageIds = new Set(pages.map((p) => p.id));
    const allChoices = await db.select().from(choice);
    const choices = allChoices.filter((c) => pageIds.has(c.pageId));
    const errors = validateStory(buildStoryInput(s, pages, choices));
    if (errors.length) return { ok: false, errors };
  }
  await db.update(story).set({ published, updatedAt: new Date() }).where(eq(story.id, storyId));
  return { ok: true };
}
