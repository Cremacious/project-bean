import { describe, it, expect } from "vitest";
import { buildCollection, type CollectionStory } from "./collection";

const stories = [
  { id: 1, slug: "bean-whispering-woods", title: "Bean Whispering Woods", ageBand: "2-4", coverImageUrl: null, coverMotif: null },
  { id: 2, slug: "sleepy-shore", title: "The Sleepy Shore", ageBand: "5-7", coverImageUrl: null, coverMotif: null },
];

const endingPages = [
  // Story 1: two good endings, one game over. Child found both good + the game over (surprise).
  { id: 10, storyId: 1, endingType: "good", isEnding: true },
  { id: 11, storyId: 1, endingType: "good", isEnding: true },
  { id: 12, storyId: 1, endingType: "game_over", isEnding: true },
  // Story 2: two good endings. Child found only one.
  { id: 20, storyId: 2, endingType: "good", isEnding: true },
  { id: 21, storyId: 2, endingType: "good", isEnding: true },
  // A non-ending page should be ignored even if it slips into the query.
  { id: 22, storyId: 2, endingType: "good", isEnding: false },
];

const foundIds = [10, 11, 12, 20];

describe("buildCollection", () => {
  const collection = buildCollection(stories, endingPages, foundIds);

  it("computes aggregate stats across stories", () => {
    expect(collection.stats).toEqual({ endingsFound: 3, storiesCompleted: 1, surprises: 1 });
  });

  it("computes per-story progress, in the given story order", () => {
    const [s1, s2] = collection.stories as CollectionStory[];
    expect(s1).toEqual({
      slug: "bean-whispering-woods", title: "Bean Whispering Woods", ageBand: "2-4",
      coverImageUrl: null, coverMotif: null,
      goodFound: 2, goodTotal: 2, complete: true, surprises: 1,
    });
    expect(s2).toEqual({
      slug: "sleepy-shore", title: "The Sleepy Shore", ageBand: "5-7",
      coverImageUrl: null, coverMotif: null,
      goodFound: 1, goodTotal: 2, complete: false, surprises: 0,
    });
  });

  it("earns badges consistent with the aggregate summary", () => {
    const earned = new Set(collection.badges.filter((b) => b.earned).map((b) => b.id));
    expect(earned.has("first-ending")).toBe(true);
    expect(earned.has("first-story")).toBe(true);
    expect(earned.has("surprise")).toBe(true);
    expect(earned.has("three-stories")).toBe(false);
    expect(earned.has("all-stories")).toBe(false);
  });
});
