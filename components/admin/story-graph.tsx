// components/admin/story-graph.tsx
// The branch graph. Nodes are positioned HTML cards over an SVG edge layer, from
// the pure layoutGraph(). Each card shows TYPE (icon + colour), a two-line peek of
// the scene text, and STATUS (a written/needs-text pill + solid vs dashed fill).
// Arrows out of a choice carry that choice's label, so you can see which option
// leads where. Every card links to its page editor. Server component.
import type { StoryGraph as StoryGraphType } from "@bedtime-quests/core/stories/graph";
import { layoutGraph, pageNeedsText } from "@bedtime-quests/core/stories/wizard/plan-status";
import type { LayoutNode } from "@bedtime-quests/core/stories/wizard/plan-status";

const NODE_W = 172;
const NODE_H = 98;
const COL_W = 212;
const ROW_H = 146;
const PAD = 24;

type NodeType = "scene" | "choice" | "good" | "surprise";
const TYPE: Record<NodeType, { color: string; icon: string; label: string }> = {
  scene: { color: "#5AA9E6", icon: "📖", label: "Scene" },
  choice: { color: "#8A5CF6", icon: "🔀", label: "Choice" },
  good: { color: "#2FB98A", icon: "🌟", label: "Good ending" },
  surprise: { color: "#FFC24B", icon: "🦉", label: "Surprise" },
};

function nodeType(n: LayoutNode): NodeType {
  if (n.isEnding) return n.endingType === "good" ? "good" : "surprise";
  return n.kind === "choice" ? "choice" : "scene";
}

export function StoryGraph({ graph, startKey, slug }: { graph: StoryGraphType; startKey: string; slug: string }) {
  const pageCount = Object.keys(graph.pages).length;
  if (pageCount === 0) return null;

  const { nodes, edges } = layoutGraph(graph, startKey);
  const maxRow = Math.max(...nodes.map((n) => n.row), 0);
  const rowCounts = new Map<number, number>();
  for (const n of nodes) rowCounts.set(n.row, (rowCounts.get(n.row) ?? 0) + 1);
  const maxCols = Math.max(...rowCounts.values(), 1);

  const width = Math.max(maxCols * COL_W, 320);
  const height = maxRow * ROW_H + NODE_H + PAD * 2;

  const pos = new Map<string, { cx: number; cy: number; left: number; top: number }>();
  const seenInRow = new Map<number, number>();
  for (const n of nodes) {
    const idx = seenInRow.get(n.row) ?? 0;
    seenInRow.set(n.row, idx + 1);
    const count = rowCounts.get(n.row)!;
    const cx = (width * (idx + 1)) / (count + 1);
    const top = PAD + n.row * ROW_H;
    pos.set(n.key, { cx, cy: top + NODE_H / 2, left: cx - NODE_W / 2, top });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
      <div className="relative mx-auto" style={{ width, height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }} aria-hidden>
          {edges.map((e, i) => {
            const a = pos.get(e.from), b = pos.get(e.to);
            if (!a || !b) return null;
            return <line key={i} x1={a.cx} y1={a.cy + NODE_H / 2} x2={b.cx} y2={b.cy - NODE_H / 2} stroke="#c7d0d8" strokeWidth={2} />;
          })}
        </svg>

        {/* Choice labels sit at the middle of each arrow that leaves a choice. */}
        {edges.map((e, i) => {
          const a = pos.get(e.from), b = pos.get(e.to);
          if (!a || !b) return null;
          const fromIsChoice = (graph.pages[e.from]?.choices.length ?? 0) >= 2;
          if (!fromIsChoice) return null;
          const label = e.label.trim() || "(no label yet)";
          return (
            <div
              key={`l${i}`}
              className="absolute z-20 max-w-[150px] truncate rounded-full border border-[#cbb6f5] bg-[#efe8fd] px-2 py-0.5 text-[10px] font-extrabold text-[#6b3fd4]"
              style={{ left: (a.cx + b.cx) / 2, top: (a.cy + b.cy) / 2, transform: "translate(-50%,-50%)" }}
              title={label}
            >
              {label}
            </div>
          );
        })}

        {nodes.map((n) => {
          const p = pos.get(n.key)!;
          const t = TYPE[nodeType(n)];
          const needs = pageNeedsText(graph.pages[n.key]);
          const body = graph.pages[n.key].body.trim();
          return (
            <a
              key={n.key}
              href={`/admin/stories/${slug}/pages/${n.key}`}
              aria-label={`Edit ${n.key}, ${t.label}, ${needs ? "needs text" : "text written"}`}
              className="absolute z-10 flex cursor-pointer flex-col gap-1 rounded-2xl p-2.5 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
              style={{
                left: p.left, top: p.top, width: NODE_W, height: NODE_H,
                ...(needs
                  ? { background: "#fff", border: `2.5px dashed ${t.color}`, color: "#16283A" }
                  : { background: t.color, color: "#fff", boxShadow: "0 4px 0 rgba(0,0,0,0.14)" }),
              }}
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
                <span className="max-w-[120px] truncate text-[11.5px] font-extrabold">{n.key}</span>
              </span>
              <span
                className="line-clamp-2 flex-1 text-[10px] italic leading-tight"
                style={{ color: needs ? "#8a97a2" : "rgba(255,255,255,0.92)" }}
              >
                {body || "(no text yet)"}
              </span>
              <span
                className="self-start rounded-full border bg-white px-1.5 text-[9px] font-extrabold"
                style={needs ? { color: "#9a6b00", borderColor: "#f0d8a0" } : { color: "#1f7a5a", borderColor: "#bfe6d5" }}
              >
                {needs ? "Needs text" : "Written ✓"}
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[var(--pc-sub)]">
        <span>📖 Scene</span>
        <span>🔀 Choice</span>
        <span>🌟 Good ending</span>
        <span>🦉 Surprise</span>
        <span className="text-[var(--pc-leaf-ink)]">Solid = written</span>
        <span className="text-[#9a6b00]">Dashed = needs text</span>
      </div>
    </div>
  );
}
