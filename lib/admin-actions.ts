// lib/admin-actions.ts
"use server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { isValidSlug, isValidSlug as isValidKey } from "@/lib/admin/slugs";
import { buildStoryInput } from "@/lib/admin/story-to-input";
import { validateStory } from "@/lib/stories/validate";
import { isMotifKey } from "@/lib/stories/covers";

async function requireAdmin(): Promise<boolean> {
  const parent = await getParent();
  return !!parent && isAdmin(parent.email);
}

const AGE_BANDS = ["2-4", "5-7", "8+"];
type StoryMeta = { title: string; slug: string; description: string; ageBand: string | null; coverImageUrl: string | null; coverMotif: string | null };

/** Keep only a valid motif key; anything else (incl. "" or null) means "auto from slug". */
function cleanMotif(motif: string | null | undefined): string | null {
  return isMotifKey(motif) ? motif : null;
}

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
    coverImageUrl: meta.coverImageUrl?.trim() || null, coverMotif: cleanMotif(meta.coverMotif), published: false,
  });
  return { ok: true, slug };
}

export async function updateStoryMeta(storyId: number, meta: Omit<StoryMeta, "slug"> & { premium: boolean }): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  const title = meta.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (meta.ageBand && !AGE_BANDS.includes(meta.ageBand)) return { ok: false, error: "Invalid age band" };
  await db.update(story).set({
    title, description: meta.description.trim(), ageBand: meta.ageBand,
    coverImageUrl: meta.coverImageUrl?.trim() || null, coverMotif: cleanMotif(meta.coverMotif),
    premium: meta.premium, updatedAt: new Date(),
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

export async function createPage(storyId: number, key: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  if (!isValidKey(key)) return { ok: false, error: "Key must be lowercase words joined by single hyphens" };
  const [dupe] = await db.select({ id: page.id }).from(page).where(and(eq(page.storyId, storyId), eq(page.key, key))).limit(1);
  if (dupe) return { ok: false, error: "That page key is already used in this story" };
  await db.insert(page).values({ storyId, key, body: "", isEnding: false });
  return { ok: true };
}

type PageEdit = { key: string; body: string; isEnding: boolean; endingType: string; endingLabel: string | null };

export async function updatePage(pageId: number, edit: PageEdit): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  if (!isValidKey(edit.key)) return { ok: false, error: "Invalid page key" };
  if (edit.isEnding && !["good", "game_over"].includes(edit.endingType)) return { ok: false, error: "Invalid ending type" };
  const [self] = await db.select({ storyId: page.storyId }).from(page).where(eq(page.id, pageId)).limit(1);
  if (!self) return { ok: false };
  const [dupe] = await db.select({ id: page.id }).from(page)
    .where(and(eq(page.storyId, self.storyId), eq(page.key, edit.key))).limit(1);
  if (dupe && dupe.id !== pageId) return { ok: false, error: "That page key is already used in this story" };
  await db.update(page).set({
    key: edit.key, body: edit.body, isEnding: edit.isEnding,
    endingType: edit.isEnding ? edit.endingType : "good",
    endingLabel: edit.isEnding ? (edit.endingLabel?.trim() || null) : null,
  }).where(eq(page.id, pageId));
  if (edit.isEnding) await db.delete(choice).where(eq(choice.pageId, pageId)); // endings have no choices
  return { ok: true };
}

export async function deletePage(pageId: number): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  await db.delete(page).where(eq(page.id, pageId)); // choices cascade
  return { ok: true };
}

/** Replace a page's choices with the given ordered list. */
export async function setChoices(pageId: number, rows: { label: string; toPageKey: string }[]): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  await db.delete(choice).where(eq(choice.pageId, pageId));
  const clean = rows.map((r, i) => ({ pageId, label: r.label.trim(), toPageKey: r.toPageKey.trim(), order: i }))
    .filter((r) => r.label && r.toPageKey);
  if (clean.length) await db.insert(choice).values(clean);
  return { ok: true };
}
