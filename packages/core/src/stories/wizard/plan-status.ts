// packages/core/src/stories/wizard/plan-status.ts
// Derives per-page role/depth, completion progress, and a layered graph layout
// from the runtime StoryGraph. Pure: serves the web app and any file source.
import type { StoryGraph, GraphPage } from "../graph";
import type { SlotRole } from "./types";

export type PageStatus = { role: SlotRole; depth: number };

/** True when a page still needs author text: its body is empty, or an ending
 *  lacks a label, or a fork choice lacks a label. Scene "Next" labels are auto. */
export function pageNeedsText(p: GraphPage): boolean {
  if (p.body.trim() === "") return true;
  if (p.isEnding) return (p.endingLabel ?? "").trim() === "";
  if (p.choices.length >= 2) return p.choices.some((c) => c.label.trim() === "");
  return false;
}

function roleOf(p: GraphPage, isStart: boolean): SlotRole {
  if (p.isEnding) return p.endingType === "good" ? "good_ending" : "surprise_ending";
  if (p.choices.length >= 2) return "choice_prompt";
  if (isStart) return "opening";
  return "scene";
}

/** BFS depth (edges from start) + role for every page. */
export function deriveRolesAndDepth(graph: StoryGraph, startKey: string): Map<string, PageStatus> {
  const depth = new Map<string, number>();
  const q: Array<[string, number]> = [[startKey, 0]];
  while (q.length) {
    const [k, d] = q.shift()!;
    if (depth.has(k)) continue;
    depth.set(k, d);
    const p = graph.pages[k];
    if (p) for (const c of p.choices) q.push([c.to, d + 1]);
  }
  const out = new Map<string, PageStatus>();
  for (const [key, p] of Object.entries(graph.pages)) {
    out.set(key, { role: roleOf(p, key === startKey), depth: depth.get(key) ?? 0 });
  }
  return out;
}

export type Progress = { total: number; written: number; needsText: number; percent: number };

export function storyProgress(graph: StoryGraph): Progress {
  const pages = Object.values(graph.pages);
  const total = pages.length;
  const needsText = pages.filter(pageNeedsText).length;
  const written = total - needsText;
  return { total, written, needsText, percent: total ? Math.round((written / total) * 100) : 0 };
}

export type LayoutNode = {
  key: string; row: number; col: number;
  kind: "scene" | "choice"; isEnding: boolean; endingType: string;
};
export type LayoutEdge = { from: string; to: string; label: string };
export type Layout = { nodes: LayoutNode[]; edges: LayoutEdge[] };

/** Layered layout: row = BFS depth, col spreads siblings within a row. The web
 *  renderer maps row/col to pixels; keeping this pure lets native reuse it. */
export function layoutGraph(graph: StoryGraph, startKey: string): Layout {
  const status = deriveRolesAndDepth(graph, startKey);
  const rows = new Map<number, string[]>();
  for (const [key, s] of status) {
    const arr = rows.get(s.depth) ?? [];
    arr.push(key);
    rows.set(s.depth, arr);
  }
  const nodes: LayoutNode[] = [];
  for (const [row, keys] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    keys.sort();
    keys.forEach((key, col) => {
      const p = graph.pages[key];
      nodes.push({
        key, row, col,
        kind: p.choices.length >= 2 ? "choice" : "scene",
        isEnding: p.isEnding, endingType: p.endingType,
      });
    });
  }
  const edges: LayoutEdge[] = [];
  for (const [key, p] of Object.entries(graph.pages)) {
    for (const c of p.choices) edges.push({ from: key, to: c.to, label: c.label });
  }
  return { nodes, edges };
}
