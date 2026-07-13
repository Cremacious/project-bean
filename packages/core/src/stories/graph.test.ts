// lib/stories/graph.test.ts
import { describe, it, expect } from "vitest";
import { buildStoryGraph, type PageRow, type ChoiceRow } from "./graph";

const pages: PageRow[] = [
  { id: 1, key: "a", body: "start", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 2, key: "b", body: "the end", isEnding: true, endingLabel: "The End", endingType: "good", imageUrl: null },
];
const choices: ChoiceRow[] = [
  { pageId: 1, toPageKey: "b", label: "go", order: 0 },
];

describe("buildStoryGraph", () => {
  it("keys pages by their key and attaches ordered choices", () => {
    const graph = buildStoryGraph(pages, choices);
    expect(Object.keys(graph.pages)).toEqual(["a", "b"]);
    expect(graph.pages.a.choices).toEqual([{ label: "go", to: "b" }]);
    expect(graph.pages.b.isEnding).toBe(true);
    expect(graph.pages.b.endingLabel).toBe("The End");
    expect(graph.pages.b.endingType).toBe("good");
  });

  it("sorts choices by order", () => {
    const c: ChoiceRow[] = [
      { pageId: 1, toPageKey: "b", label: "second", order: 1 },
      { pageId: 1, toPageKey: "b", label: "first", order: 0 },
    ];
    const graph = buildStoryGraph(pages, c);
    expect(graph.pages.a.choices.map((x) => x.label)).toEqual(["first", "second"]);
  });

  it("counts ending pages", () => {
    const graph = buildStoryGraph(pages, choices);
    expect(graph.totalEndings).toBe(1);
  });

  it("counts good endings", () => {
    const graph = buildStoryGraph(pages, choices);
    expect(graph.goodEndings).toBe(1);
  });
});
