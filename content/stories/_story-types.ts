// content/stories/_story-types.ts
import type { MotifKey } from "@/lib/stories/covers";

export type ChoiceInput = {
  label: string;
  to: string; // target page key
};

export type PageInput = {
  body: string;
  choices?: ChoiceInput[];
  ending?: string;   // presence marks this page as an ending; value is the ending label
  endingKind?: "good" | "game_over"; // only meaningful when `ending` is set; defaults to "good"
  imageUrl?: string; // nullable; unused in v1 UI
};

export type StoryInput = {
  slug: string;
  title: string;
  description?: string;
  ageBand?: "2-4" | "5-7" | "8+";
  start: string;     // page key to start on
  coverImageUrl?: string;
  coverMotif?: MotifKey; // pins a StoryCover motif (#26); omit to auto-derive from slug
  premium?: boolean; // free-tier gating (#34); omit or true = premium, false = a free sampler
  pages: Record<string, PageInput>; // keyed by page key
};

/** Identity helper that gives full type-checking + autocomplete when authoring stories. */
export function defineStory(story: StoryInput): StoryInput {
  return story;
}
