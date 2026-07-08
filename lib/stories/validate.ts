// lib/stories/validate.ts
import type { StoryInput } from "@/content/stories/_story-types";

/** Returns an array of human-readable error strings. Empty array = valid. */
export function validateStory(story: StoryInput): string[] {
  const errors: string[] = [];
  const keys = Object.keys(story.pages);

  if (story.ageBand !== undefined && !["2-4", "5-7", "8+"].includes(story.ageBand)) {
    errors.push(`age band "${story.ageBand}" is not one of 2-4, 5-7, 8+`);
  }

  if (!(story.start in story.pages)) {
    errors.push(`start page "${story.start}" does not exist`);
  }

  for (const [key, pageData] of Object.entries(story.pages)) {
    const isEnding = pageData.ending !== undefined;
    const choices = pageData.choices ?? [];

    if (isEnding && choices.length > 0) {
      errors.push(`page "${key}" is an ending but has choices`);
    }
    if (!isEnding && choices.length === 0) {
      errors.push(`page "${key}" is not an ending but has no choices`);
    }
    for (const c of choices) {
      if (!keys.includes(c.to)) {
        errors.push(`page "${key}" choice -> "${c.to}" targets a missing page`);
      }
    }
  }

  return errors;
}
