import { describe, it, expect } from "vitest";
import { buildStoryGraph } from "../graph";
import { deriveRolesAndDepth, storyProgress, layoutGraph, pageNeedsText } from "./plan-status";

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

describe("layoutGraph", () => {
  it("places the start at row 0 and gives every page a position", () => {
    const l = layoutGraph(graph, "opening");
    expect(l.nodes).toHaveLength(4);
    expect(l.nodes.find((n) => n.key === "opening")!.row).toBe(0);
    expect(l.nodes.find((n) => n.key === "pick")!.kind).toBe("choice");
    expect(l.edges.length).toBe(3);
  });
});
