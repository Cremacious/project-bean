import { describe, it, expect } from "vitest";
import { graphFromStoryInput } from "./from-input";
import type { StoryInput } from "./story-types";

const STORY: StoryInput = {
  slug: "demo",
  title: "Demo",
  start: "start",
  pages: {
    start: {
      body: "Hello {{name}}.",
      choices: [
        { label: "Go left", to: "left" },
        { label: "Go right", to: "right" },
      ],
    },
    left: { body: "A cozy ending.", ending: "The Cozy One", endingKind: "good" },
    right: { body: "Back to bed.", ending: "The Sleepy Loop", endingKind: "game_over" },
  },
};

describe("graphFromStoryInput", () => {
  it("resolves the start key from the story", () => {
    expect(graphFromStoryInput(STORY).startKey).toBe("start");
  });

  it("falls back to the first page when start is missing", () => {
    const broken = { ...STORY, start: "nope" };
    expect(graphFromStoryInput(broken).startKey).toBe("start");
  });

  it("marks endings and counts good vs total", () => {
    const { graph } = graphFromStoryInput(STORY);
    expect(graph.totalEndings).toBe(2);
    expect(graph.goodEndings).toBe(1);
    expect(graph.pages.left.isEnding).toBe(true);
    expect(graph.pages.left.endingLabel).toBe("The Cozy One");
    expect(graph.pages.left.endingType).toBe("good");
    expect(graph.pages.right.endingType).toBe("game_over");
    expect(graph.pages.start.isEnding).toBe(false);
  });

  it("defaults an ending with no endingKind to good", () => {
    const s: StoryInput = {
      slug: "d",
      title: "D",
      start: "a",
      pages: { a: { body: "x", ending: "End" } },
    };
    expect(graphFromStoryInput(s).graph.pages.a.endingType).toBe("good");
  });

  it("carries choices through unchanged and assigns stable ids by order", () => {
    const { graph, idByKey } = graphFromStoryInput(STORY);
    expect(graph.pages.start.choices).toEqual([
      { label: "Go left", to: "left" },
      { label: "Go right", to: "right" },
    ]);
    expect(idByKey).toEqual({ start: 1, left: 2, right: 3 });
    expect(graph.pages.start.id).toBe(1);
  });
});
