// lib/admin/wizard-actions.ts
"use server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";
import { isAdminRequest } from "@/lib/admin-session";
import { isValidSlug } from "@bedtime-quests/core/admin/slugs";
import { expandTemplate } from "@bedtime-quests/core/stories/wizard/templates";
import type { TemplateId, AgeBandOrNone } from "@bedtime-quests/core/stories/wizard/types";

const AGE_BANDS = ["2-4", "5-7", "8+"];
/** Auto label for a scene's single "Next" choice (dash free, never author-set). */
const SCENE_NEXT_LABEL = "Turn the page";

export type GenerateInput = {
  title: string;
  slug: string;
  description: string;
  ageBand: string | null;
  templateId: TemplateId;
  good: number;
  surprise: number;
};

/**
 * Expand a template into a fresh draft story and its page/choice rows, then set
 * the start page. Fork choices start with an empty label for the author to fill;
 * scene "Next" choices get the auto label. Inserts directly (not via setChoices,
 * which drops empty labels) so wired-but-unlabeled forks survive as "needs text".
 */
export async function generateFromTemplate(input: GenerateInput): Promise<{ ok: boolean; slug?: string; error?: string }> {
  if (!(await isAdminRequest())) return { ok: false, error: "Not allowed" };

  const title = input.title.trim();
  const slug = input.slug.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (!isValidSlug(slug)) return { ok: false, error: "Slug must be lowercase words joined by single hyphens" };
  if (input.ageBand && !AGE_BANDS.includes(input.ageBand)) return { ok: false, error: "Invalid age band" };

  const [dupe] = await db.select({ id: story.id }).from(story).where(eq(story.slug, slug)).limit(1);
  if (dupe) return { ok: false, error: "That slug is already taken" };

  const scaffold = expandTemplate(input.templateId, {
    ageBand: (input.ageBand ?? null) as AgeBandOrNone,
    good: input.good,
    surprise: input.surprise,
  });

  const [created] = await db.insert(story).values({
    slug, title, description: input.description.trim(), ageBand: input.ageBand, published: false,
  }).returning({ id: story.id });

  const insertedPages = await db.insert(page).values(
    scaffold.pages.map((p) => ({
      storyId: created.id,
      key: p.key,
      body: "",
      isEnding: p.isEnding,
      endingType: p.endingKind ?? "good",
      endingLabel: null,
    })),
  ).returning({ id: page.id, key: page.key });

  const idByKey = new Map(insertedPages.map((r) => [r.key, r.id]));

  const choiceRows = scaffold.pages.flatMap((p) =>
    p.choices.map((c, i) => ({
      pageId: idByKey.get(p.key)!,
      toPageKey: c.toKey,
      label: p.kind === "scene" ? SCENE_NEXT_LABEL : "",
      order: i,
    })),
  );
  if (choiceRows.length) await db.insert(choice).values(choiceRows);

  await db.update(story).set({ startPageId: idByKey.get(scaffold.startKey)! }).where(eq(story.id, created.id));

  return { ok: true, slug };
}
