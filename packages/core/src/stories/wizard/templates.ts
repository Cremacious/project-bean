// packages/core/src/stories/wizard/templates.ts
// Deterministic template generators. Each template has a distinct topology but
// they share riverSegment (a reconverging "diamond" chain) so the invariants are
// uniform: start is a scene; Scene -> Choice -> Scene alternation; every good
// ending sits behind >= minChoices choice points; the tree stays bounded; the
// requested good/surprise counts are met exactly.
//
//   Adventure Trail   one reconverging spine, surprises as side exits, fan at end
//   Two Paths Meet    two paths that rejoin at a shared "meet" scene, then a tail
//   Branching Tree    a divergent tree: choices branch at two levels, no rejoin
//   Twin Trails       one branch into two disjoint trails, each its own river
import type {
  AgeBandOrNone, Scaffold, ScaffoldPage, TemplateId, BranchFlavor,
} from "./types";
import { minChoicesToGoodEnding } from "./endings";

export type Template = {
  id: TemplateId;
  name: string;
  description: string;
  ageBands: AgeBandOrNone[]; // recommended-for bands (informational for the UI)
};

type ExpandOpts = { ageBand: AgeBandOrNone; good: number; surprise: number };

// --- slot helpers --------------------------------------------------------
function scene(key: string, next?: string, isEnding = false, endingKind?: "good" | "game_over"): ScaffoldPage {
  return { key, kind: "scene", isEnding, endingKind, choices: next ? [{ toKey: next }] : [] };
}
function choicePage(key: string, forks: Array<{ toKey: string; flavor: BranchFlavor }>): ScaffoldPage {
  return { key, kind: "choice", isEnding: false, choices: forks };
}
function setNext(pages: ScaffoldPage[], sceneKey: string, nextKey: string): void {
  pages.find((p) => p.key === sceneKey)!.choices = [{ toKey: nextKey }];
}

/**
 * Fan a set of good-ending keys out of a choice page, capping every choice at
 * three forks. Beyond three, two are placed here and the rest hang off a bridge
 * scene leading to a follow-up choice (recursion). Bridge keys derive from the
 * choice key so they stay unique across a story with several fans.
 */
function fanGoodEndings(pages: ScaffoldPage[], choiceKey: string, endKeys: string[]): void {
  if (endKeys.length <= 3) {
    pages.push(choicePage(choiceKey, endKeys.map((k, i) => ({ toKey: k, flavor: i % 2 ? "curious" : "calm" }))));
    for (const k of endKeys) pages.push(scene(k, undefined, true, "good"));
    return;
  }
  const head = endKeys.slice(0, 2);
  const rest = endKeys.slice(2);
  const bridge = `${choiceKey}-bridge`;
  const nextChoice = `${choiceKey}-fan`;
  pages.push(choicePage(choiceKey, [
    { toKey: head[0], flavor: "calm" },
    { toKey: head[1], flavor: "curious" },
    { toKey: bridge, flavor: "curious" },
  ]));
  for (const k of head) pages.push(scene(k, undefined, true, "good"));
  pages.push(scene(bridge, nextChoice));
  fanGoodEndings(pages, nextChoice, rest);
}

/**
 * A reconverging river: `choiceCount` choices where each non-final choice forks
 * into two flavored scenes that rejoin (a diamond); the earliest choices may
 * carry a third fork to a gentle surprise ending. The final choice fans the
 * good endings. `entryScene` is an existing scene whose Next is wired to the
 * first choice. All internal keys are namespaced by `prefix`.
 */
function riverSegment(
  pages: ScaffoldPage[], prefix: string, entryScene: string,
  choiceCount: number, goodKeys: string[], surpriseKeys: string[],
): void {
  let prev = entryScene;
  let placed = 0;
  const oopsFork = (): Array<{ toKey: string; flavor: BranchFlavor }> => {
    if (placed >= surpriseKeys.length) return [];
    const key = surpriseKeys[placed++];
    pages.push(scene(key, undefined, true, "game_over"));
    return [{ toKey: key, flavor: "curious" }];
  };

  for (let n = 1; n <= choiceCount; n++) {
    const cKey = `${prefix}-c${n}`;
    setNext(pages, prev, cKey);
    const isLast = n === choiceCount;
    const aKey = `${prefix}-s${n}a`, bKey = `${prefix}-s${n}b`, joinKey = `${prefix}-j${n}`;

    if (isLast && goodKeys.length >= 2) {
      // Two or more good endings: the final choice fans them (2 to 3 per choice).
      fanGoodEndings(pages, cKey, goodKeys);
      continue;
    }

    // A reconverging diamond. For a non-final choice the join continues to the
    // next choice; for the final choice (a single good ending) the join
    // continues, via a plain Next, straight to that good ending scene.
    pages.push(choicePage(cKey, [
      { toKey: aKey, flavor: "calm" },
      { toKey: bKey, flavor: "curious" },
      ...oopsFork(),
    ]));
    pages.push(scene(aKey, joinKey));
    pages.push(scene(bKey, joinKey));
    if (isLast) {
      pages.push(scene(joinKey, goodKeys[0]));
      pages.push(scene(goodKeys[0], undefined, true, "good"));
    } else {
      pages.push(scene(joinKey));
      prev = joinKey;
    }
  }
}

/**
 * A reconverging river with no fan: `choiceCount` diamonds that rejoin, then the
 * final join continues (plain Next) to `exitKey`. Used as a shared trunk before
 * a later branch. Surprises may be placed as early side exits.
 */
function reconvergingTrunk(
  pages: ScaffoldPage[], prefix: string, entryScene: string,
  choiceCount: number, exitKey: string, surpriseKeys: string[],
): void {
  if (choiceCount <= 0) { setNext(pages, entryScene, exitKey); return; }
  let prev = entryScene;
  let placed = 0;
  for (let n = 1; n <= choiceCount; n++) {
    const cKey = `${prefix}-c${n}`;
    setNext(pages, prev, cKey);
    const aKey = `${prefix}-s${n}a`, bKey = `${prefix}-s${n}b`, joinKey = `${prefix}-j${n}`;
    const forks: Array<{ toKey: string; flavor: BranchFlavor }> = [
      { toKey: aKey, flavor: "calm" },
      { toKey: bKey, flavor: "curious" },
    ];
    if (placed < surpriseKeys.length) {
      forks.push({ toKey: surpriseKeys[placed], flavor: "curious" });
      pages.push(scene(surpriseKeys[placed], undefined, true, "game_over"));
      placed++;
    }
    pages.push(choicePage(cKey, forks));
    pages.push(scene(aKey, joinKey));
    pages.push(scene(bKey, joinKey));
    pages.push(scene(joinKey, n === choiceCount ? exitKey : undefined));
    prev = joinKey;
  }
}

// --- key allocators ------------------------------------------------------
function goodKeys(n: number): string[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => `good-${i + 1}`);
}
function surpriseKeys(n: number): string[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => `oops-${i + 1}`);
}

// --- builders ------------------------------------------------------------

/** One reconverging spine with side exits and a final fan. */
function buildAdventureTrail(m: number, good: number, surprise: number): Scaffold {
  const pages = [scene("opening")];
  riverSegment(pages, "trail", "opening", m, goodKeys(good), surpriseKeys(surprise));
  return { startKey: "opening", pages };
}

/** One branch into two disjoint trails, each its own river to its endings. */
function buildTwinTrails(m: number, good: number, surprise: number): Scaffold {
  const pages = [scene("opening")];
  const g = goodKeys(good);
  const half = Math.ceil(g.length / 2);
  const gA = g.slice(0, half), gB = g.slice(half).length ? g.slice(half) : [g[g.length - 1]];
  const s = surpriseKeys(surprise);
  const capA = Math.max(0, (m - 1) - 1);
  const sA = s.slice(0, capA), sB = s.slice(capA);

  setNext(pages, "opening", "twin-c1");
  pages.push(choicePage("twin-c1", [
    { toKey: "trailA-s0", flavor: "calm" },
    { toKey: "trailB-s0", flavor: "curious" },
  ]));
  pages.push(scene("trailA-s0"));
  pages.push(scene("trailB-s0"));
  riverSegment(pages, "trailA", "trailA-s0", m - 1, gA, sA);
  riverSegment(pages, "trailB", "trailB-s0", m - 1, gB, sB);
  return { startKey: "opening", pages };
}

/** Two paths that rejoin at a shared meet scene, then a shared tail to endings. */
function buildTwoPathsMeet(m: number, good: number, surprise: number): Scaffold {
  const pages = [scene("opening")];
  setNext(pages, "opening", "meet-c1");
  pages.push(choicePage("meet-c1", [
    { toKey: "meet-a1", flavor: "calm" },
    { toKey: "meet-b1", flavor: "curious" },
  ]));
  // Path A and Path B each make one choice, and both land on the shared meet.
  pages.push(scene("meet-a1", "meet-c2a"));
  pages.push(choicePage("meet-c2a", [{ toKey: "meet-a2a", flavor: "calm" }, { toKey: "meet-a2b", flavor: "curious" }]));
  pages.push(scene("meet-a2a", "meet"));
  pages.push(scene("meet-a2b", "meet"));
  pages.push(scene("meet-b1", "meet-c2b"));
  pages.push(choicePage("meet-c2b", [{ toKey: "meet-b2a", flavor: "calm" }, { toKey: "meet-b2b", flavor: "curious" }]));
  pages.push(scene("meet-b2a", "meet"));
  pages.push(scene("meet-b2b", "meet"));
  pages.push(scene("meet")); // Next wired by the tail river
  // The shared tail carries the remaining choices to reach depth m, plus the fan.
  riverSegment(pages, "meet-tail", "meet", m - 2, goodKeys(good), surpriseKeys(surprise));
  return { startKey: "opening", pages };
}

/**
 * A divergent tree that stays bounded: a shared reconverging trunk carries most
 * of the depth, then the story branches (once or twice) into disjoint short
 * regions that each reach their own good ending. The branch points are true
 * mid-branches, so the shape reads as a maze without tripling the page count.
 */
function buildBranchingTree(m: number, good: number, surprise: number): Scaffold {
  const pages = [scene("opening")];
  const g = goodKeys(good);
  const s = surpriseKeys(surprise);
  // Trunk holds all but the last two choices; the branch(es) and leaf take the rest.
  const trunkLen = Math.max(0, m - 2);
  reconvergingTrunk(pages, "brk", "opening", trunkLen, "brk-a", s);

  // First branch (depth m-1): left vs right.
  pages.push(choicePage("brk-a", [{ toKey: "brk-L", flavor: "calm" }, { toKey: "brk-R", flavor: "curious" }]));
  pages.push(scene("brk-L"));
  pages.push(scene("brk-R"));

  if (g.length >= 4) {
    // Branch again on both sides: four leaves, each one choice deep (depth m).
    setNext(pages, "brk-L", "brk-bL");
    setNext(pages, "brk-R", "brk-bR");
    pages.push(choicePage("brk-bL", [{ toKey: "brk-LL", flavor: "calm" }, { toKey: "brk-LR", flavor: "curious" }]));
    pages.push(choicePage("brk-bR", [{ toKey: "brk-RL", flavor: "calm" }, { toKey: "brk-RR", flavor: "curious" }]));
    pages.push(scene("brk-LL")); pages.push(scene("brk-LR"));
    pages.push(scene("brk-RL")); pages.push(scene("brk-RR"));
    riverSegment(pages, "brLL", "brk-LL", 1, [g[0]], []);
    riverSegment(pages, "brLR", "brk-LR", 1, [g[1]], []);
    riverSegment(pages, "brRL", "brk-RL", 1, [g[2]], []);
    riverSegment(pages, "brRR", "brk-RR", 1, [g[3]], []);
  } else if (g.length === 3) {
    // Branch again on the left: three leaves (LL, LR under the left; R direct).
    setNext(pages, "brk-L", "brk-bL");
    pages.push(choicePage("brk-bL", [{ toKey: "brk-LL", flavor: "calm" }, { toKey: "brk-LR", flavor: "curious" }]));
    pages.push(scene("brk-LL")); pages.push(scene("brk-LR"));
    riverSegment(pages, "brLL", "brk-LL", 1, [g[0]], []);
    riverSegment(pages, "brLR", "brk-LR", 1, [g[1]], []);
    riverSegment(pages, "brR", "brk-R", 1, [g[2]], []);
  } else {
    // Two good endings: one branch into two short leaves.
    riverSegment(pages, "brL", "brk-L", 1, [g[0]], []);
    riverSegment(pages, "brR", "brk-R", 1, g.slice(1).length ? g.slice(1) : [g[0]], []);
  }
  return { startKey: "opening", pages };
}

/**
 * Rename every generated page to a friendly, valid key by role, in reading order
 * from the start: `opening`, then `scene-N`, `choice-N`, `ending-N`, `surprise-N`.
 * This keeps internal builder names out of the author's way and guarantees every
 * key is a valid slug (lowercase words joined by single hyphens). All references
 * (choice targets, the start key) are rewritten to match.
 */
function prettifyKeys(sc: Scaffold): Scaffold {
  const byKey = new Map(sc.pages.map((p) => [p.key, p]));
  const rename = new Map<string, string>();
  const n = { scene: 0, choice: 0, good: 0, surprise: 0 };
  const nameFor = (p: ScaffoldPage, isStart: boolean): string => {
    if (isStart) return "opening";
    if (p.isEnding) return p.endingKind === "game_over" ? `surprise-${++n.surprise}` : `ending-${++n.good}`;
    return p.kind === "choice" ? `choice-${++n.choice}` : `scene-${++n.scene}`;
  };
  const queue = [sc.startKey];
  const seen = new Set<string>();
  while (queue.length) {
    const k = queue.shift()!;
    if (seen.has(k)) continue;
    seen.add(k);
    const p = byKey.get(k);
    if (!p) continue;
    rename.set(k, nameFor(p, k === sc.startKey));
    for (const c of p.choices) queue.push(c.toKey);
  }
  // Any page not reached from the start still gets a stable, valid key.
  for (const p of sc.pages) if (!rename.has(p.key)) rename.set(p.key, nameFor(p, false));

  return {
    startKey: rename.get(sc.startKey)!,
    pages: sc.pages.map((p) => ({
      ...p,
      key: rename.get(p.key)!,
      choices: p.choices.map((c) => ({ ...c, toKey: rename.get(c.toKey)! })),
    })),
  };
}

// --- registry ------------------------------------------------------------
export const TEMPLATES: Template[] = [
  { id: "twin-trails", name: "Twin Trails", description: "Two little paths and a few cozy scenes, for the youngest listeners.", ageBands: ["2-4"] },
  { id: "two-paths-meet", name: "Two Paths That Meet", description: "Two paths join at a shared scene, then split into endings.", ageBands: ["5-7"] },
  { id: "branching-tree", name: "Branching Tree", description: "Forks within forks, a real little maze of choices.", ageBands: ["5-7", "8+"] },
  { id: "adventure-trail", name: "Adventure Trail", description: "A long river of choices toward one big finale, with gentle detours.", ageBands: ["8+"] },
];

export function expandTemplate(id: TemplateId, opts: ExpandOpts): Scaffold {
  if (id === "blank") return { startKey: "opening", pages: [scene("opening")] };
  const m = minChoicesToGoodEnding(opts.ageBand);
  const { good, surprise } = opts;
  switch (id) {
    case "twin-trails": return prettifyKeys(buildTwinTrails(m, good, surprise));
    case "two-paths-meet": return prettifyKeys(buildTwoPathsMeet(m, good, surprise));
    case "branching-tree": return prettifyKeys(buildBranchingTree(m, good, surprise));
    case "adventure-trail": return prettifyKeys(buildAdventureTrail(m, good, surprise));
  }
}
