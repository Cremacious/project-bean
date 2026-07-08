// content/stories/_story-types.ts

export type ChoiceInput = {
  label: string;
  to: string; // target page key
};

export type PageInput = {
  body: string;
  choices?: ChoiceInput[];
  ending?: string;   // presence marks this page as an ending; value is the ending label
  imageUrl?: string; // nullable; unused in v1 UI
};

export type StoryInput = {
  slug: string;
  title: string;
  description?: string;
  readers: string[]; // reader usernames who may see this story
  start: string;     // page key to start on
  coverImageUrl?: string;
  pages: Record<string, PageInput>; // keyed by page key
};

/** Identity helper that gives full type-checking + autocomplete when authoring stories. */
export function defineStory(story: StoryInput): StoryInput {
  return story;
}
