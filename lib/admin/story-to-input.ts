// lib/admin/story-to-input.ts
import type { StoryInput, PageInput } from "@bedtime-quests/core/stories/story-types";
import type { AdminStory, AdminPage, AdminChoice } from "@/lib/admin/queries";

/** Pure: rebuild the StoryInput the validator expects from DB rows. */
export function buildStoryInput(story: AdminStory, pages: AdminPage[], choices: AdminChoice[]): StoryInput {
  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? "";
  const choicesByPage = new Map<number, AdminChoice[]>();
  for (const c of choices) {
    const arr = choicesByPage.get(c.pageId) ?? [];
    arr.push(c);
    choicesByPage.set(c.pageId, arr);
  }

  const pageEntries: Record<string, PageInput> = {};
  for (const p of pages) {
    if (p.isEnding) {
      pageEntries[p.key] = {
        body: p.body,
        ending: p.endingLabel ?? "", // presence (even "") marks an ending for the validator
        endingKind: p.endingType === "game_over" ? "game_over" : "good",
      };
    } else {
      const rows = (choicesByPage.get(p.id) ?? []).slice().sort((a, b) => a.order - b.order);
      pageEntries[p.key] = { body: p.body, choices: rows.map((c) => ({ label: c.label, to: c.toPageKey })) };
    }
  }

  return {
    slug: story.slug,
    title: story.title,
    description: story.description,
    ageBand: (story.ageBand ?? undefined) as StoryInput["ageBand"],
    start: startKey,
    coverImageUrl: story.coverImageUrl ?? undefined,
    pages: pageEntries,
  };
}
