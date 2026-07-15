import { describe, it, expect } from "vitest";
import { buildStoryInput } from "./story-to-input";
import { validateStory } from "@bedtime-quests/core/stories/validate";

const storyRow = { id: 1, slug: "bean", title: "Bean", description: "", ageBand: "2-4" as string | null, startPageId: 10, coverImageUrl: null, coverMotif: null, premium: false, published: false, createdAt: new Date(), updatedAt: new Date() };
const pages = [
  { id: 10, storyId: 1, key: "start", body: "Hello {{name}}", imageUrl: null, isEnding: false, endingLabel: null, endingType: "good" },
  { id: 11, storyId: 1, key: "good", body: "The end", imageUrl: null, isEnding: true, endingLabel: "A happy ending", endingType: "good" },
];
const choices = [{ id: 1, pageId: 10, toPageKey: "good", label: "Finish", order: 0 }];

describe("buildStoryInput", () => {
  it("produces a StoryInput that validateStory accepts", () => {
    const input = buildStoryInput(storyRow, pages, choices);
    expect(input.start).toBe("start");
    expect(input.pages.good.ending).toBe("A happy ending");
    expect(input.pages.good.endingKind).toBe("good");
    expect(input.pages.start.choices).toEqual([{ label: "Finish", to: "good" }]);
    expect(validateStory(input)).toEqual([]);
  });
  it("surfaces a dangling choice as a validation error", () => {
    const bad = buildStoryInput(storyRow, pages, [{ id: 2, pageId: 10, toPageKey: "missing", label: "Go", order: 0 }]);
    expect(validateStory(bad).some((e) => e.includes("missing"))).toBe(true);
  });
  it("an unset start page fails validation", () => {
    const noStart = buildStoryInput({ ...storyRow, startPageId: null }, pages, choices);
    expect(validateStory(noStart).some((e) => e.includes("start page"))).toBe(true);
  });
});
