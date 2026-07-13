import { describe, it, expect } from "vitest";
import { computeStoryProgress, deriveBadges, BADGES } from "./progress";

const endings = [
  { pageId: 1, endingType: "good" },
  { pageId: 2, endingType: "good" },
  { pageId: 3, endingType: "game_over" },
];

describe("computeStoryProgress", () => {
  it("counts good found / total, completion, surprises", () => {
    const p = computeStoryProgress(endings, [1, 3]);
    expect(p).toEqual({ goodFound: 1, goodTotal: 2, complete: false, surprises: 1 });
  });
  it("marks complete when all good endings are found", () => {
    expect(computeStoryProgress(endings, [1, 2]).complete).toBe(true);
  });
  it("a story with no good endings is never complete", () => {
    expect(computeStoryProgress([{ pageId: 9, endingType: "game_over" }], [9]).complete).toBe(false);
  });
});

describe("deriveBadges", () => {
  it("earns first-ending and surprise, not the rest", () => {
    const badges = deriveBadges({ goodEndingsFound: 1, storiesCompleted: 0, storiesTotal: 3, surprisesFound: 1 });
    const earned = new Set(badges.filter((b) => b.earned).map((b) => b.id));
    expect(earned.has("first-ending")).toBe(true);
    expect(earned.has("surprise")).toBe(true);
    expect(earned.has("first-story")).toBe(false);
  });
  it("earns all-stories only when every story is complete", () => {
    const b = deriveBadges({ goodEndingsFound: 20, storiesCompleted: 3, storiesTotal: 3, surprisesFound: 2 });
    expect(b.find((x) => x.id === "all-stories")!.earned).toBe(true);
  });
  it("returns one entry per defined badge", () => {
    expect(deriveBadges({ goodEndingsFound: 0, storiesCompleted: 0, storiesTotal: 0, surprisesFound: 0 }).length).toBe(BADGES.length);
  });
});
