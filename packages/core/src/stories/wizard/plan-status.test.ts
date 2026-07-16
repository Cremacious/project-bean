import { describe, it, expect } from "vitest";
import { buildStoryGraph } from "../graph";
import { deriveRolesAndDepth, storyProgress, layoutGraph, pageNeedsText, reachableKeys, enumeratePaths } from "./plan-status";

// A tiny story: opening scene -> choice -> two endings.
const pages = [
  { id: 1, key: "opening", body: "Hi {{name}}", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 2, key: "pick", body: "Which way?", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 3, key: "warm", body: "", isEnding: true, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 4, key: "loop", body: "Round we go.", isEnding: true, endingLabel: "Loopy", endingType: "game_over", imageUrl: null },
];
const choices = [
  { pageId: 1, toPageKey: "pick", label: "Turn the page", order: 0 },
  { pageId: 2, toPageKey: "warm", label: "Go warm", order: 0 },
  { pageId: 2, toPageKey: "loop", label: "Go loop", order: 1 },
];
const graph = buildStoryGraph(pages, choices);

describe("deriveRolesAndDepth", () => {
  it("labels the start opening, the fork a choice, endings by kind", () => {
    const m = deriveRolesAndDepth(graph, "opening");
    expect(m.get("opening")!.role).toBe("opening");
    expect(m.get("pick")!.role).toBe("choice_prompt");
    expect(m.get("warm")!.role).toBe("good_ending");
    expect(m.get("loop")!.role).toBe("surprise_ending");
    expect(m.get("pick")!.depth).toBe(1);
  });
});

describe("pageNeedsText", () => {
  it("flags an empty body and a labelled ending with empty body", () => {
    expect(pageNeedsText(graph.pages.warm)).toBe(true); // empty body + no label
    expect(pageNeedsText(graph.pages.opening)).toBe(false);
    expect(pageNeedsText(graph.pages.loop)).toBe(false); // body + label present
  });
});

describe("storyProgress", () => {
  it("counts pages needing text", () => {
    const p = storyProgress(graph);
    expect(p.total).toBe(4);
    expect(p.written).toBe(3);
    expect(p.needsText).toBe(1);
    expect(p.percent).toBe(75);
  });
});

describe("reachableKeys", () => {
  it("returns every page reachable from the opening", () => {
    const r = reachableKeys(graph, "opening");
    expect([...r].sort()).toEqual(["loop", "opening", "pick", "warm"]);
  });
  it("leaves out an orphan page", () => {
    const withOrphan = buildStoryGraph(
      [...pages, { id: 5, key: "lost", body: "", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null }],
      choices,
    );
    expect(reachableKeys(withOrphan, "opening").has("lost")).toBe(false);
  });
});

describe("enumeratePaths", () => {
  it("lists each route from the opening to an ending", () => {
    const paths = enumeratePaths(graph, "opening");
    expect(paths).toContainEqual(["opening", "pick", "warm"]);
    expect(paths).toContainEqual(["opening", "pick", "loop"]);
    expect(paths).toHaveLength(2);
  });
  it("terminates on a cycle instead of looping forever", () => {
    const cyclic = buildStoryGraph(
      [
        { id: 1, key: "a", body: "a", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
        { id: 2, key: "b", body: "b", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
      ],
      [
        { pageId: 1, toPageKey: "b", label: "to b", order: 0 },
        { pageId: 2, toPageKey: "a", label: "back to a", order: 0 },
      ],
    );
    const paths = enumeratePaths(cyclic, "a");
    expect(paths).toEqual([["a", "b"]]);
  });
});

describe("layoutGraph", () => {
  it("places the start at row 0 and gives every page a position", () => {
    const l = layoutGraph(graph, "opening");
    expect(l.nodes).toHaveLength(4);
    expect(l.nodes.find((n) => n.key === "opening")!.row).toBe(0);
    expect(l.nodes.find((n) => n.key === "pick")!.kind).toBe("choice");
    expect(l.edges.length).toBe(3);
  });
});
