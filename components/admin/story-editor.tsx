// components/admin/story-editor.tsx
// The story structure editor used on /admin/stories/[slug]. One unified surface
// with three views the author toggles between:
//   List  — a focused, scrollable list of pages with contextual hints, filters,
//           and a jump to the next page that still needs text (mobile home).
//   Map   — the branch graph as a genuinely touch navigable canvas: pinch or
//           wheel to zoom, drag to pan, plus zoom and fit buttons (desktop home).
//   Paths — every route from the opening to an ending, so the author can see how
//           each path through the story is structured.
// Every page opens its full screen editor at /admin/stories/[slug]/pages/[key].
"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { StoryGraph, GraphPage } from "@bedtime-quests/core/stories/graph";
import { layoutGraph, pageNeedsText, reachableKeys, enumeratePaths } from "@bedtime-quests/core/stories/wizard/plan-status";
import { AddPageControl } from "@/components/admin/add-page-control";

type Kind = "opening" | "scene" | "choice" | "good" | "surprise";
const TYPE: Record<Kind, { color: string; icon: string; label: string }> = {
  opening: { color: "#5AA9E6", icon: "🚩", label: "Opening" },
  scene: { color: "#5AA9E6", icon: "📖", label: "Scene" },
  choice: { color: "#8A5CF6", icon: "🔀", label: "Choice" },
  good: { color: "#2FB98A", icon: "🌟", label: "Good ending" },
  surprise: { color: "#FFC24B", icon: "🦉", label: "Surprise" },
};

function kindOf(p: GraphPage, isStart: boolean): Kind {
  if (p.isEnding) return p.endingType === "good" ? "good" : "surprise";
  if (p.choices.length >= 2) return "choice";
  return isStart ? "opening" : "scene";
}

type Hint = { text: string; tone: "info" | "warn" | "bad" };
const HINT_STYLE: Record<Hint["tone"], React.CSSProperties> = {
  info: { color: "#2b5f86", borderColor: "#bcdcf2", background: "#eaf4fb" },
  warn: { color: "#9a6b00", borderColor: "#f0d8a0", background: "#FFF7E6" },
  bad: { color: "#b02a2a", borderColor: "#f2c2c2", background: "#FDECEC" },
};

function hintsFor(p: GraphPage, isStart: boolean, reachable: boolean): Hint[] {
  const h: Hint[] = [];
  if (isStart) h.push({ text: "Opening", tone: "info" });
  if (!reachable && !isStart) h.push({ text: "Not reachable from the opening", tone: "bad" });
  if (!p.isEnding && p.choices.length === 0) h.push({ text: "Dead end, add a choice or make it an ending", tone: "bad" });
  if (pageNeedsText(p)) h.push({ text: "Needs text", tone: "warn" });
  return h;
}

const primaryBtn =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--pc-plum)] px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px";
const smallBtn =
  "cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white px-3 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px";
const chipCls = (on: boolean) =>
  `cursor-pointer rounded-full border px-3 py-1.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px ${on ? "border-[var(--pc-plum)] bg-[var(--pc-plum)] text-white" : "border-[var(--pc-line)] bg-white text-[var(--pc-ink)]"}`;

type View = "list" | "map" | "paths";

export function StoryEditor({ graph, startKey, slug, storyId }: { graph: StoryGraph; startKey: string; slug: string; storyId: number }) {
  // Ordered page keys, structural order (BFS depth then key), reused everywhere.
  const orderedKeys = useMemo(() => layoutGraph(graph, startKey).nodes.map((n) => n.key), [graph, startKey]);
  const reachable = useMemo(() => reachableKeys(graph, startKey), [graph, startKey]);
  const pageHref = (key: string) => `/admin/stories/${slug}/pages/${key}`;

  // Default view depends on screen size: List on phones, Map on desktop. The
  // author's own pick always wins after that. We start on List for a stable
  // server render, then upgrade to Map on wide screens before the first paint.
  const [view, setView] = useState<View>("list");
  const picked = useRef(false);
  useLayoutEffect(() => {
    if (!picked.current && typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setView("map");
    }
  }, []);
  const choose = (v: View) => { picked.current = true; setView(v); };

  const VIEWS: { id: View; label: string }[] = [
    { id: "list", label: "List" },
    { id: "map", label: "Map" },
    { id: "paths", label: "Paths" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-extrabold">Story map</h2>
        <p className="hidden text-sm text-[var(--pc-sub)] sm:block">Tap any page to write it. Green pages have text, amber pages still need some.</p>
      </div>

      {/* View toggle, available on every screen size. */}
      <div className="grid max-w-sm grid-cols-3 gap-1 rounded-2xl border border-[var(--pc-line)] bg-white p-1 shadow-[0_3px_0_var(--pc-line)]" role="tablist" aria-label="Story views">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => choose(v.id)}
            className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px ${view === v.id ? "bg-[var(--pc-plum)] text-white" : "text-[var(--pc-ink)] hover:bg-[var(--pc-sky)]"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "list" && <ListView graph={graph} orderedKeys={orderedKeys} startKey={startKey} reachable={reachable} slug={slug} storyId={storyId} pageHref={pageHref} />}
      {view === "map" && <MapView graph={graph} startKey={startKey} reachable={reachable} pageHref={pageHref} />}
      {view === "paths" && <PathsView graph={graph} startKey={startKey} reachable={reachable} pageHref={pageHref} />}
    </div>
  );
}

// ── List view ────────────────────────────────────────────────────────────────
type Filter = "all" | "needs" | "endings" | "problems";

function ListView({ graph, orderedKeys, startKey, reachable, slug, storyId, pageHref }: {
  graph: StoryGraph; orderedKeys: string[]; startKey: string; reachable: Set<string>; slug: string; storyId: number; pageHref: (k: string) => string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const nextNeeds = orderedKeys.find((k) => pageNeedsText(graph.pages[k]));

  const shown = orderedKeys.filter((k) => {
    const p = graph.pages[k];
    if (filter === "needs") return pageNeedsText(p);
    if (filter === "endings") return p.isEnding;
    if (filter === "problems") return hintsFor(p, k === startKey, reachable.has(k)).some((h) => h.tone === "bad");
    return true;
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All pages" },
    { id: "needs", label: "Needs text" },
    { id: "endings", label: "Endings" },
    { id: "problems", label: "Problems" },
  ];

  return (
    <div className="space-y-3">
      {nextNeeds && (
        <Link href={pageHref(nextNeeds)} className={primaryBtn}>
          <span aria-hidden>✏️</span> Write the next page that needs text
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={chipCls(filter === f.id)}>{f.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-6 text-center text-sm font-semibold text-[var(--pc-sub)] shadow-[0_4px_0_var(--pc-line)]">No pages here yet.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((k) => {
            const p = graph.pages[k];
            const isStart = k === startKey;
            const t = TYPE[kindOf(p, isStart)];
            const hints = hintsFor(p, isStart, reachable.has(k));
            const body = p.body.trim();
            return (
              <li key={k}>
                <Link
                  href={pageHref(k)}
                  className="block w-full cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white p-3 text-left outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
                  style={{ borderLeft: `6px solid ${t.color}` }}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{t.icon}</span>
                    <span className="font-display text-base font-extrabold text-[var(--pc-ink)]">{k}</span>
                    <span className="ml-auto text-xs font-bold text-[var(--pc-sub)]">{t.label}</span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {hints.length === 0 ? (
                      <span className="rounded-full border px-2 py-0.5 text-[11px] font-extrabold" style={{ color: "#1f7a5a", borderColor: "#bfe6d5", background: "#E6F7F0" }}>Written ✓</span>
                    ) : hints.map((h, i) => (
                      <span key={i} className="rounded-full border px-2 py-0.5 text-[11px] font-extrabold" style={HINT_STYLE[h.tone]}>{h.text}</span>
                    ))}
                  </span>
                  <span className="mt-1.5 block text-[13px] italic leading-snug text-[var(--pc-sub)]">
                    {body || "No text yet. Tap to write this scene."}
                  </span>
                  {p.choices.length > 0 && (
                    <span className="mt-2 flex flex-col gap-1">
                      {p.choices.map((c, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-[12px] font-bold text-[#6b3fd4]">
                          <span aria-hidden>↳</span>
                          <span className="max-w-[60%] truncate rounded-full border border-[#cbb6f5] bg-[#efe8fd] px-2 py-0.5">{c.label.trim() || "(no label yet)"}</span>
                          <span className="truncate text-[var(--pc-sub)]">to {c.to}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <AddPageControl storyId={storyId} slug={slug} />
    </div>
  );
}

// ── Map view: touch navigable pan and zoom canvas ────────────────────────────
const NODE_W = 168, NODE_H = 96, COL_W = 204, ROW_H = 152, PAD = 28;
const MIN_SCALE = 0.35, MAX_SCALE = 2;

function MapView({ graph, startKey, reachable, pageHref }: {
  graph: StoryGraph; startKey: string; reachable: Set<string>; pageHref: (k: string) => string;
}) {
  const { nodes, edges } = useMemo(() => layoutGraph(graph, startKey), [graph, startKey]);
  const { width, height, pos } = useMemo(() => {
    const rowCounts = new Map<number, number>();
    for (const n of nodes) rowCounts.set(n.row, (rowCounts.get(n.row) ?? 0) + 1);
    const maxCols = Math.max(...rowCounts.values(), 1);
    const maxRow = Math.max(...nodes.map((n) => n.row), 0);
    const width = Math.max(maxCols * COL_W, 320);
    const height = maxRow * ROW_H + NODE_H + PAD * 2;
    const seen = new Map<number, number>();
    const pos = new Map<string, { cx: number; cy: number; left: number; top: number }>();
    for (const n of nodes) {
      const idx = seen.get(n.row) ?? 0;
      seen.set(n.row, idx + 1);
      const count = rowCounts.get(n.row)!;
      const cx = (width * (idx + 1)) / (count + 1);
      const top = PAD + n.row * ROW_H;
      pos.set(n.key, { cx, cy: top + NODE_H / 2, left: cx - NODE_W / 2, top });
    }
    return { width, height, pos };
  }, [nodes]);

  const frameRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ scale: 0.8, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const moved = useRef(false);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const fit = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    const cw = el.clientWidth, ch = el.clientHeight;
    const scale = clampScale(Math.min(cw / (width + PAD * 2), ch / (height)) * 0.95);
    setT({ scale, x: (cw - width * scale) / 2, y: Math.max(PAD / 2, (ch - height * scale) / 2) });
  }, [width, height]);

  // Fit once the frame has a measured size.
  useLayoutEffect(() => { fit(); }, [fit]);

  // Zoom around a focal point in frame coordinates so the point under the finger
  // or cursor stays put.
  const zoomAround = useCallback((nextScale: number, fx: number, fy: number) => {
    setT((cur) => {
      const s = clampScale(nextScale);
      const k = s / cur.scale;
      return { scale: s, x: fx - (fx - cur.x) * k, y: fy - (fy - cur.y) * k };
    });
  }, []);

  const zoomButton = (dir: 1 | -1) => {
    const el = frameRef.current;
    if (!el) return;
    zoomAround(t.scale * (dir === 1 ? 1.2 : 1 / 1.2), el.clientWidth / 2, el.clientHeight / 2);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: t.scale };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = frameRef.current!.getBoundingClientRect();
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      zoomAround(pinch.current.scale * (dist / pinch.current.dist), midX, midY);
      moved.current = true;
      return;
    }
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true;
    setT((cur) => ({ ...cur, x: cur.x + dx, y: cur.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const rect = frameRef.current!.getBoundingClientRect();
    zoomAround(t.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Zoom out" onClick={() => zoomButton(-1)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl border border-[var(--pc-line)] bg-white text-xl font-extrabold shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px">−</button>
        <button type="button" aria-label="Zoom in" onClick={() => zoomButton(1)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl border border-[var(--pc-line)] bg-white text-xl font-extrabold shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px">+</button>
        <button type="button" onClick={fit} className={smallBtn}>Fit to screen</button>
        <p className="text-xs font-bold text-[var(--pc-sub)]">Pinch or scroll to zoom, drag to pan.</p>
      </div>

      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className="relative h-[60vh] max-h-[560px] min-h-[360px] cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-[var(--pc-line)] bg-white shadow-[0_4px_0_var(--pc-line)] active:cursor-grabbing"
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})` }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }} aria-hidden>
            {edges.map((e, i) => {
              const a = pos.get(e.from), b = pos.get(e.to);
              if (!a || !b) return null;
              return <line key={i} x1={a.cx} y1={a.cy + NODE_H / 2} x2={b.cx} y2={b.cy - NODE_H / 2} stroke="#c7d0d8" strokeWidth={2} />;
            })}
          </svg>

          {edges.map((e, i) => {
            const a = pos.get(e.from), b = pos.get(e.to);
            if (!a || !b) return null;
            if ((graph.pages[e.from]?.choices.length ?? 0) < 2) return null;
            const label = e.label.trim() || "(no label yet)";
            return (
              <div key={`l${i}`} className="pointer-events-none absolute z-20 max-w-[160px] truncate rounded-full border border-[#cbb6f5] bg-[#efe8fd] px-2 py-0.5 text-[10px] font-extrabold text-[#6b3fd4]"
                style={{ left: (a.cx + b.cx) / 2, top: (a.cy + b.cy) / 2, transform: "translate(-50%,-50%)" }} title={label}>
                {label}
              </div>
            );
          })}

          {nodes.map((n) => {
            const p = graph.pages[n.key];
            const isStart = n.key === startKey;
            const t2 = TYPE[kindOf(p, isStart)];
            const needs = pageNeedsText(p);
            const orphan = !reachable.has(n.key) && !isStart;
            const pp = pos.get(n.key)!;
            const body = p.body.trim();
            return (
              <Link
                key={n.key}
                href={pageHref(n.key)}
                onClick={(ev) => { if (moved.current) { ev.preventDefault(); } }}
                aria-label={`Edit ${n.key}, ${t2.label}, ${needs ? "needs text" : "text written"}`}
                className="absolute z-10 flex flex-col gap-1 rounded-2xl p-2.5 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                style={{
                  left: pp.left, top: pp.top, width: NODE_W, height: NODE_H,
                  ...(needs
                    ? { background: "#fff", border: `2.5px dashed ${t2.color}`, color: "#16283A" }
                    : { background: t2.color, color: "#fff", boxShadow: "0 4px 0 rgba(0,0,0,0.14)" }),
                  ...(orphan ? { outline: "2.5px solid #b02a2a", outlineOffset: 2 } : {}),
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>{t2.icon}</span>
                  <span className="truncate text-[12px] font-extrabold">{n.key}</span>
                </span>
                <span className="line-clamp-2 flex-1 text-[10.5px] italic leading-tight" style={{ color: needs ? "#8a97a2" : "rgba(255,255,255,0.92)" }}>
                  {body || "(no text yet)"}
                </span>
                <span className="self-start rounded-full border bg-white px-1.5 text-[9px] font-extrabold" style={needs ? { color: "#9a6b00", borderColor: "#f0d8a0" } : { color: "#1f7a5a", borderColor: "#bfe6d5" }}>
                  {needs ? "Needs text" : "Written ✓"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--pc-sub)]">
        <span>📖 Scene</span><span>🔀 Choice</span><span>🌟 Good ending</span><span>🦉 Surprise</span>
        <span className="text-[var(--pc-leaf-ink)]">Solid = written</span>
        <span className="text-[#9a6b00]">Dashed = needs text</span>
      </div>
    </div>
  );
}

// ── Paths view: how each route is structured ─────────────────────────────────
function PathsView({ graph, startKey, reachable, pageHref }: {
  graph: StoryGraph; startKey: string; reachable: Set<string>; pageHref: (k: string) => string;
}) {
  const paths = useMemo(() => enumeratePaths(graph, startKey), [graph, startKey]);
  const orphans = useMemo(() => Object.keys(graph.pages).filter((k) => !reachable.has(k) && k !== startKey), [graph, reachable, startKey]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--pc-ink)]">Every route a reader can take, from the opening to an ending. Amber steps still need text.</p>
      {paths.length === 0 ? (
        <p className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-6 text-center text-sm font-semibold text-[var(--pc-sub)] shadow-[0_4px_0_var(--pc-line)]">Add a page to start a path.</p>
      ) : (
        paths.map((path, pi) => {
          const last = graph.pages[path[path.length - 1]];
          const end = last ? TYPE[kindOf(last, path.length === 1)] : TYPE.scene;
          const needs = path.some((k) => pageNeedsText(graph.pages[k]));
          return (
            <div key={pi} className="rounded-2xl border border-[var(--pc-line)] bg-white p-3 shadow-[0_4px_0_var(--pc-line)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-extrabold text-[var(--pc-ink)]">Path {pi + 1}</span>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: end.color, color: end.label === "Surprise" ? "#4a3400" : "#fff" }}>{end.icon} {end.label}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {path.map((k, i) => {
                  const needsK = pageNeedsText(graph.pages[k]);
                  return (
                    <span key={k} className="flex items-center gap-1">
                      <Link href={pageHref(k)} className="cursor-pointer rounded-full border px-2 py-1 text-[12px] font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
                        style={needsK ? HINT_STYLE.warn : { color: "var(--pc-ink)", borderColor: "var(--pc-line)", background: "#fff" }}>
                        {k}
                      </Link>
                      {i < path.length - 1 && <span aria-hidden className="text-[var(--pc-sub)]">→</span>}
                    </span>
                  );
                })}
              </div>
              {needs && <p className="mt-2 text-xs font-bold text-[#9a6b00]">Some steps on this path still need text.</p>}
            </div>
          );
        })
      )}
      {orphans.length > 0 && (
        <div className="rounded-2xl border border-[#f2c2c2] bg-[#FDECEC] p-3 text-sm font-semibold text-[#b02a2a]">
          {orphans.length === 1 ? "1 page is" : `${orphans.length} pages are`} not on any path yet. Connect from a choice, or delete: {orphans.join(", ")}.
        </div>
      )}
    </div>
  );
}
