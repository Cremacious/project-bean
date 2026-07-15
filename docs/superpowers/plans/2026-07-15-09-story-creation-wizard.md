# Story Creation Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided story creation wizard that plans everything except the prose: it generates a branching scaffold from an age group, ending count, and template, then tracks per-page text status and validates a publishable story.

**Architecture:** All planning, template expansion, placeholders, layout, and validation live in `packages/core` (pure, unit-tested). The web layer at `/admin` renders the wizard steps and the enhanced editor, and persists scaffolds into the existing `story`/`page`/`choice` tables via server actions. No new database schema.

**Tech Stack:** TypeScript, `@bedtime-quests/core` (Vitest), Next.js 16 App Router, React 19, Tailwind v4 (Paper Cut tokens), Drizzle ORM + Neon.

**Spec:** [2026-07-15-story-creation-wizard-design.md](../specs/2026-07-15-story-creation-wizard-design.md)

---

## Project policies (read before starting)

- **Branch/commit:** Work directly on `master`. Do **NOT** create a feature branch. Do **NOT** commit until the user gives explicit final approval; then make a single commit ending `Closes #86`. Because of this, tasks below end with a **Checkpoint** (run the tests) instead of a `git commit` step. Do not run `git commit` between tasks.
- **Depends on #85:** The `/admin` shell + auth land first. The enhanced editor reuses `/admin/stories/[slug]`; the wizard reuses `getParent` + `isAdmin` gating.
- **Never** read, print, or commit `.env.local`.
- **No dashes** in any displayed copy. `npm run test` and `npm run build` must pass. Keep `packages/core` free of DOM/Next/RN/DB imports.
- Core subpath imports resolve via the package `"./*": "./src/*.ts"` export, so `@bedtime-quests/core/stories/wizard/endings` maps to `packages/core/src/stories/wizard/endings.ts` with no package.json change.

---

## File structure

**New in `packages/core` (pure logic + co-located tests):**
- `src/stories/wizard/types.ts` — shared wizard types (`AgeBandOrNone`, `EndingCounts`, `SlotRole`, `BranchFlavor`, `TemplateId`, `Scaffold`, `ScaffoldPage`, `ScaffoldChoice`).
- `src/stories/wizard/endings.ts` (+ `.test.ts`) — ending-count suggestion + minimum choice depth.
- `src/stories/wizard/placeholders.ts` (+ `.test.ts`) — instructional hint lookup.
- `src/stories/wizard/templates.ts` (+ `.test.ts`) — template registry + `expandTemplate`, built on a shared gauntlet builder.
- `src/stories/wizard/plan-status.ts` (+ `.test.ts`) — role/depth derivation, progress, `layoutGraph`.
- `src/stories/wizard/validate-complete.ts` (+ `.test.ts`) — `lintStoryContent` + `validateStoryComplete`.

**New/modified in the web app:**
- `lib/admin/wizard-actions.ts` — `"use server"` action `generateFromTemplate` (expand → insert rows).
- `components/admin/wizard/*` — the step UI (`age-step.tsx`, `endings-step.tsx`, `template-step.tsx`, `title-step.tsx`, `wizard.tsx`, `template-shape.tsx`).
- `app/admin/stories/new/page.tsx` — mount the wizard (replaces the plain `NewStoryForm`; keep `createStory` for the Blank path).
- `components/admin/story-graph.tsx` — branch graph (SVG) from `layoutGraph`.
- `components/admin/story-progress.tsx` — completion meter + two-tier publish panel.
- `app/admin/stories/[slug]/page.tsx` — mount the graph + progress; pass hint data down.
- `components/admin/page-editor.tsx` + `choices-editor.tsx` — show ghost-text hints; keep wired-but-unlabeled choices.
- `components/admin/publish-control.tsx` — gate on `validateStoryComplete().blocking`.
- `docs/AUTHORING.md` — document scene pages + the rhythm rule.

---

## Phase 1 — Core planning primitives

### Task 1: Ending-count suggestions + minimum choice depth

**Files:**
- Create: `packages/core/src/stories/wizard/types.ts`
- Create: `packages/core/src/stories/wizard/endings.ts`
- Test: `packages/core/src/stories/wizard/endings.test.ts`

- [ ] **Step 1: Create shared types**

`packages/core/src/stories/wizard/types.ts`:

```ts
// packages/core/src/stories/wizard/types.ts
// Shared, platform-agnostic types for the story creation wizard.
import type { AgeBand } from "../story-types";

/** An age band, or null when the author chose no band. */
export type AgeBandOrNone = AgeBand | null;

/** How many of each ending a story should have. */
export type EndingCounts = { good: number; surprise: number };

/** A suggested count with the inclusive range the author may pick within. */
export type EndingSuggestion = EndingCounts & {
  goodRange: [number, number];
  surpriseRange: [number, number];
};

/** The role a generated slot plays, used to pick a placeholder hint. */
export type SlotRole =
  | "opening"
  | "scene"
  | "pre_choice_scene"
  | "choice_prompt"
  | "good_ending"
  | "surprise_ending";

/** The template tags each branch so choice hints can differ. */
export type BranchFlavor = "calm" | "curious";

export type TemplateId =
  | "twin-trails"
  | "two-paths-meet"
  | "branching-tree"
  | "adventure-trail"
  | "blank";

/** A choice inside a scaffold. `flavor` is set only for fork choices. */
export type ScaffoldChoice = { toKey: string; flavor?: BranchFlavor };

/** One generated page slot. A scene has exactly one (Next) choice unless it
 *  is a terminal ending; a choice page has 2 or 3 fork choices. */
export type ScaffoldPage = {
  key: string;
  kind: "scene" | "choice";
  isEnding: boolean;
  endingKind?: "good" | "game_over";
  choices: ScaffoldChoice[];
};

/** The output of expanding a template: pages + the start page key. */
export type Scaffold = { startKey: string; pages: ScaffoldPage[] };
```

- [ ] **Step 2: Write the failing test**

`packages/core/src/stories/wizard/endings.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { suggestEndingCounts, minChoicesToGoodEnding } from "./endings";

describe("suggestEndingCounts", () => {
  it("suggests 2 good / 1 surprise for ages 2 to 4", () => {
    expect(suggestEndingCounts("2-4")).toEqual({
      good: 2, surprise: 1, goodRange: [2, 3], surpriseRange: [0, 2],
    });
  });
  it("suggests 3 good / 2 surprise for ages 8 up", () => {
    const s = suggestEndingCounts("8+");
    expect(s.good).toBe(3);
    expect(s.surprise).toBe(2);
    expect(s.goodRange).toEqual([3, 4]);
  });
  it("defaults to 3 good / 1 surprise for no age band", () => {
    expect(suggestEndingCounts(null).good).toBe(3);
    expect(suggestEndingCounts(null).surprise).toBe(1);
  });
  it("never suggests fewer than one good ending", () => {
    for (const band of ["2-4", "5-7", "8+", null] as const) {
      expect(suggestEndingCounts(band).goodRange[0]).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("minChoicesToGoodEnding", () => {
  it("is 3 / 5 / 7 by band and 5 for no band", () => {
    expect(minChoicesToGoodEnding("2-4")).toBe(3);
    expect(minChoicesToGoodEnding("5-7")).toBe(5);
    expect(minChoicesToGoodEnding("8+")).toBe(7);
    expect(minChoicesToGoodEnding(null)).toBe(5);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm run test -w @bedtime-quests/core -- endings`
Expected: FAIL (module not found / functions undefined).

- [ ] **Step 4: Implement**

`packages/core/src/stories/wizard/endings.ts`:

```ts
// packages/core/src/stories/wizard/endings.ts
import type { AgeBandOrNone, EndingSuggestion } from "./types";

/** Suggested ending counts per age band, with author-adjustable ranges.
 *  Grounded in docs/AUTHORING.md (aim for 2 to 4 good, 0 to 2 surprise). */
export function suggestEndingCounts(ageBand: AgeBandOrNone): EndingSuggestion {
  switch (ageBand) {
    case "2-4": return { good: 2, surprise: 1, goodRange: [2, 3], surpriseRange: [0, 2] };
    case "5-7": return { good: 3, surprise: 1, goodRange: [2, 4], surpriseRange: [0, 2] };
    case "8+":  return { good: 3, surprise: 2, goodRange: [3, 4], surpriseRange: [0, 3] };
    default:    return { good: 3, surprise: 1, goodRange: [1, 4], surpriseRange: [0, 2] };
  }
}

/** Minimum number of choice points a reader passes before a good ending. */
export function minChoicesToGoodEnding(ageBand: AgeBandOrNone): number {
  switch (ageBand) {
    case "2-4": return 3;
    case "5-7": return 5;
    case "8+":  return 7;
    default:    return 5;
  }
}
```

- [ ] **Step 5: Checkpoint**

Run: `npm run test -w @bedtime-quests/core -- endings`
Expected: PASS. (Do not commit; see project policies.)

---

### Task 2: Placeholder hint lookup

**Files:**
- Create: `packages/core/src/stories/wizard/placeholders.ts`
- Test: `packages/core/src/stories/wizard/placeholders.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/core/src/stories/wizard/placeholders.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { placeholderFor, choiceLabelHint } from "./placeholders";

const DASH = /[‐-―−-]/; // hyphen, en/em dash, minus

describe("placeholderFor", () => {
  it("returns a role-appropriate hint for an opening scene", () => {
    expect(placeholderFor("opening", "2-4", 0)).toMatch(/\{\{name\}\}/);
  });
  it("is deterministic for the same inputs", () => {
    expect(placeholderFor("scene", "5-7", 2)).toBe(placeholderFor("scene", "5-7", 2));
  });
  it("never contains a dash in any hint", () => {
    const roles = ["opening", "scene", "pre_choice_scene", "choice_prompt", "good_ending", "surprise_ending"] as const;
    for (const r of roles) for (const b of ["2-4", "5-7", "8+", null] as const)
      expect(placeholderFor(r, b, 1)).not.toMatch(DASH);
  });
  it("differs by branch flavor for choice labels", () => {
    expect(choiceLabelHint("calm")).not.toBe(choiceLabelHint("curious"));
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -w @bedtime-quests/core -- placeholders`
Expected: FAIL.

- [ ] **Step 3: Implement**

`packages/core/src/stories/wizard/placeholders.ts`:

```ts
// packages/core/src/stories/wizard/placeholders.ts
// Hand-written, deterministic hint lookup. No AI, no network. Every string is
// dash free (app-wide rule) and is shown as ghost text, never saved.
import type { AgeBandOrNone, SlotRole, BranchFlavor } from "./types";

const HINTS: Record<SlotRole, string[]> = {
  opening: [
    "Introduce {{name}} and a companion, and set a cozy scene. Where are they as the story begins?",
  ],
  scene: [
    "Describe what they find here. Keep it calm and short.",
    "A gentle beat of the journey. What do {{name}} and their friend notice now?",
    "Slow the moment down. A soft, sleepy detail before the next step.",
  ],
  pre_choice_scene: [
    "Set up the decision. End on a gentle question for {{name}}.",
    "Two paths appear. Describe them, then ask which way to go.",
  ],
  choice_prompt: [
    "Offer two different paths, like a calm one and a curious one.",
  ],
  good_ending: [
    "Land somewhere warm and sleepy. A happy finish to collect.",
    "Wind all the way down to cozy and calm. A lovely place to end.",
  ],
  surprise_ending: [
    "A silly, gentle oops that loops back. Nothing scary.",
  ],
};

/** Pick a dash-free instructional hint for a slot. Deterministic in `depth`. */
export function placeholderFor(role: SlotRole, _ageBand: AgeBandOrNone, depth: number): string {
  const bucket = HINTS[role];
  const i = ((depth % bucket.length) + bucket.length) % bucket.length;
  return bucket[i];
}

/** A starter hint for a fork choice label, by branch flavor. */
export function choiceLabelHint(flavor: BranchFlavor): string {
  return flavor === "calm" ? "e.g. Curl up and rest a while" : "e.g. Peek around the corner";
}
```

> Note: age band is accepted for future wording variation but not yet used; keep the parameter so callers and the spec's signature stay stable.

- [ ] **Step 4: Checkpoint**

Run: `npm run test -w @bedtime-quests/core -- placeholders`
Expected: PASS.

---

### Task 3: Template registry + `expandTemplate`

This is the core generator. All non-blank templates share one **gauntlet builder** that guarantees the invariants; each template is a config. Tests assert invariants (rhythm, depth, counts, valid wiring) rather than exact shapes, so the builder can evolve.

**Files:**
- Create: `packages/core/src/stories/wizard/templates.ts`
- Test: `packages/core/src/stories/wizard/templates.test.ts`

- [ ] **Step 1: Write the failing test (invariant-based)**

`packages/core/src/stories/wizard/templates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TEMPLATES, expandTemplate } from "./templates";
import type { Scaffold, ScaffoldPage } from "./types";

function byKey(s: Scaffold): Map<string, ScaffoldPage> {
  return new Map(s.pages.map((p) => [p.key, p]));
}
function forkChoiceCount(p: ScaffoldPage): number {
  return p.kind === "choice" ? p.choices.length : 0;
}
/** BFS min choice-depth (number of choice pages passed) from start to a page. */
function choiceDepths(s: Scaffold): Map<string, number> {
  const map = byKey(s);
  const depth = new Map<string, number>();
  const q: Array<[string, number]> = [[s.startKey, 0]];
  while (q.length) {
    const [k, d] = q.shift()!;
    if (depth.has(k) && depth.get(k)! <= d) continue;
    depth.set(k, d);
    const p = map.get(k);
    if (!p) continue;
    for (const c of p.choices) q.push([c.toKey, d + (p.kind === "choice" ? 1 : 0)]);
  }
  return depth;
}

describe("expandTemplate invariants", () => {
  const cases = [
    { id: "twin-trails" as const, band: "2-4" as const, good: 2, surprise: 1, minDepth: 3 },
    { id: "two-paths-meet" as const, band: "5-7" as const, good: 3, surprise: 1, minDepth: 5 },
    { id: "branching-tree" as const, band: "8+" as const, good: 4, surprise: 2, minDepth: 7 },
    { id: "adventure-trail" as const, band: "8+" as const, good: 3, surprise: 2, minDepth: 7 },
  ];

  for (const c of cases) {
    it(`${c.id}: obeys the rhythm rule`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const map = byKey(s);
      // Start is a scene.
      expect(map.get(s.startKey)!.kind).toBe("scene");
      // No choice page leads directly to another choice page (scene between).
      for (const p of s.pages)
        for (const ch of p.choices)
          if (p.kind === "choice") expect(map.get(ch.toKey)!.kind).toBe("scene");
      // Every scene (non-ending) leads only to a choice or a scene, and has exactly one Next.
      for (const p of s.pages)
        if (p.kind === "scene" && !p.isEnding) expect(p.choices.length).toBe(1);
    });

    it(`${c.id}: produces the requested ending counts`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const good = s.pages.filter((p) => p.isEnding && p.endingKind === "good").length;
      const surprise = s.pages.filter((p) => p.isEnding && p.endingKind === "game_over").length;
      expect(good).toBe(c.good);
      expect(surprise).toBe(c.surprise);
    });

    it(`${c.id}: every good ending sits behind at least the minimum choices`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const depths = choiceDepths(s);
      for (const p of s.pages)
        if (p.isEnding && p.endingKind === "good")
          expect(depths.get(p.key)!).toBeGreaterThanOrEqual(c.minDepth);
    });

    it(`${c.id}: choices only point at existing pages, forks have 2 or 3`, () => {
      const s = expandTemplate(c.id, { ageBand: c.band, good: c.good, surprise: c.surprise });
      const keys = new Set(s.pages.map((p) => p.key));
      for (const p of s.pages) {
        for (const ch of p.choices) expect(keys.has(ch.toKey)).toBe(true);
        if (p.kind === "choice") expect(forkChoiceCount(p)).toBeGreaterThanOrEqual(2);
        if (p.kind === "choice") expect(forkChoiceCount(p)).toBeLessThanOrEqual(3);
      }
    });
  }

  it("blank template is a single opening scene", () => {
    const s = expandTemplate("blank", { ageBand: null, good: 0, surprise: 0 });
    expect(s.pages).toHaveLength(1);
    expect(s.pages[0].key).toBe(s.startKey);
    expect(s.pages[0].kind).toBe("scene");
    expect(s.pages[0].isEnding).toBe(false);
  });

  it("registry lists every non-blank template with a name and description", () => {
    for (const t of TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -w @bedtime-quests/core -- templates`
Expected: FAIL.

- [ ] **Step 3: Implement the gauntlet builder + templates**

`packages/core/src/stories/wizard/templates.ts`:

```ts
// packages/core/src/stories/wizard/templates.ts
// Deterministic template generators. Every non-blank template is a thin config
// over buildGauntlet, which guarantees: start is a scene; Scene -> Choice ->
// Scene alternation; every good ending sits behind >= minChoices choice points;
// paths reconverge so page counts stay bounded; requested ending counts are met.
import type { AgeBandOrNone, EndingCounts, Scaffold, ScaffoldPage, TemplateId, BranchFlavor } from "./types";
import { minChoicesToGoodEnding } from "./endings";

export type Template = {
  id: TemplateId;
  name: string;
  description: string;
  ageBands: AgeBandOrNone[]; // recommended-for bands (informational for the UI)
};

type ExpandOpts = { ageBand: AgeBandOrNone; good: number; surprise: number };

// --- helpers -------------------------------------------------------------
function scene(key: string, next?: string, isEnding = false, endingKind?: "good" | "game_over"): ScaffoldPage {
  return { key, kind: "scene", isEnding, endingKind, choices: next ? [{ toKey: next }] : [] };
}
function choicePage(key: string, forks: Array<{ toKey: string; flavor: BranchFlavor }>): ScaffoldPage {
  return { key, kind: "choice", isEnding: false, choices: forks };
}
const FLAVORS: BranchFlavor[] = ["calm", "curious"];

/**
 * Build a reconverging "river" of `minChoices` choice points. Early choices
 * fork to two flavored scenes that rejoin the spine (meaningful flavor, bounded
 * tree). `surprise` of the early forks lead instead to a gentle oops ending.
 * The final choice fans into `good` good-ending scenes.
 */
function buildGauntlet(minChoices: number, counts: EndingCounts): Scaffold {
  const pages: ScaffoldPage[] = [];
  const good = Math.max(1, counts.good);
  const surprise = Math.max(0, counts.surprise);

  const opening = "opening";
  pages.push(scene(opening)); // Next wired below.

  // The spine: choiceN -> two flavored scenes -> sceneN (rejoin) -> choiceN+1.
  let prevSceneNext = opening; // the scene whose Next should point at the next choice
  let surprisesPlaced = 0;

  for (let n = 1; n <= minChoices; n++) {
    const isLast = n === minChoices;
    const cKey = `choice-${n}`;
    // wire the previous scene's Next to this choice
    const prev = pages.find((p) => p.key === prevSceneNext)!;
    prev.choices = [{ toKey: cKey }];

    if (!isLast) {
      const aKey = `scene-${n}a`, bKey = `scene-${n}b`, joinKey = `scene-${n}`;
      // Place a surprise on the "b" branch of the earliest choices, up to `surprise`.
      const bIsSurprise = surprisesPlaced < surprise && n <= surprise + 1 && n >= 2;
      const forks = [
        { toKey: aKey, flavor: "calm" as BranchFlavor },
        { toKey: bKey, flavor: "curious" as BranchFlavor },
      ];
      pages.push(choicePage(cKey, forks));
      pages.push(scene(aKey, joinKey));
      if (bIsSurprise) {
        pages.push(scene(bKey, undefined, true, "game_over"));
        surprisesPlaced++;
      } else {
        pages.push(scene(bKey, joinKey));
      }
      pages.push(scene(joinKey)); // rejoin scene; Next wired next loop
      prevSceneNext = joinKey;
    } else {
      // Final choice fans into the good endings (2 or 3 forks; extra endings
      // hang off an added mini-fork scene to respect the 3-fork cap).
      const endKeys = Array.from({ length: good }, (_, i) => `good-${i + 1}`);
      const forks = endKeys.slice(0, 3).map((k, i) => ({ toKey: k, flavor: FLAVORS[i % 2] }));
      pages.push(choicePage(cKey, forks));
      for (const k of endKeys.slice(0, 3)) pages.push(scene(k, undefined, true, "good"));
      // If more than 3 good endings, add one extra scene+choice layer for the rest.
      let rest = endKeys.slice(3);
      let hostFork = forks[forks.length - 1];
      while (rest.length) {
        const bridge = `scene-fan-${rest.length}`;
        const nextChoice = `choice-fan-${rest.length}`;
        // redirect one fork through a bridge scene to another choice
        hostFork.toKey = bridge;
        const host = pages.find((p) => p.key === bridge);
        if (!host) pages.push(scene(bridge, nextChoice));
        const take = rest.slice(0, 3);
        rest = rest.slice(3);
        const fanForks = take.map((k, i) => ({ toKey: k, flavor: FLAVORS[i % 2] }));
        pages.push(choicePage(nextChoice, fanForks));
        for (const k of take) if (!pages.find((p) => p.key === k)) pages.push(scene(k, undefined, true, "good"));
        hostFork = fanForks[fanForks.length - 1];
      }
    }
  }

  // Any surprise endings not placed on early branches: hang one extra off the
  // opening's flavor is not possible (rhythm), so add them as an early detour.
  // Simplest correct approach: if unplaced surprises remain, convert additional
  // early "b" scenes; buildGauntlet callers keep surprise <= minChoices - 1.
  return { startKey: opening, pages };
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
  const minChoices = minChoicesToGoodEnding(opts.ageBand);
  // All four shapes currently share the gauntlet builder; their differences are
  // flavor + naming, refined in later polish. The invariants are identical.
  return buildGauntlet(minChoices, { good: opts.good, surprise: opts.surprise });
}
```

> Implementation note: the four non-blank templates begin as one shared gauntlet to guarantee the invariants under test. Differentiating their exact shapes (a real "meet" reconvergence for `two-paths-meet`, deeper sub-forks for `branching-tree`) is a **refinement** done in Task 12 while keeping every test in Step 1 green. Do not add differentiation until the invariant tests pass for the shared builder.

- [ ] **Step 4: Run the tests, iterate until green**

Run: `npm run test -w @bedtime-quests/core -- templates`
Expected: PASS for all invariant cases. If a `good`/`surprise`/`minDepth` combo fails, fix the builder (not the test) until the invariants hold.

- [ ] **Step 5: Checkpoint** — all core tests so far pass: `npm run test -w @bedtime-quests/core`.

---

## Phase 2 — Core status + validation

### Task 4: Role/depth derivation, progress, and graph layout

**Files:**
- Create: `packages/core/src/stories/wizard/plan-status.ts`
- Test: `packages/core/src/stories/wizard/plan-status.test.ts`

Works on the runtime `StoryGraph` (from `stories/graph.ts`) so it serves both the DB-backed web app and any file-backed source.

- [ ] **Step 1: Write the failing test**

`packages/core/src/stories/wizard/plan-status.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildStoryGraph } from "../graph";
import { deriveRolesAndDepth, storyProgress, layoutGraph } from "./plan-status";

// A tiny story: opening scene -> choice -> two endings.
const pages = [
  { id: 1, key: "opening", body: "Hi {{name}}", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 2, key: "pick", body: "Which way?", isEnding: false, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 3, key: "warm", body: "", isEnding: true, endingLabel: null, endingType: "good", imageUrl: null },
  { id: 4, key: "loop", body: "", isEnding: true, endingLabel: "Loopy", endingType: "game_over", imageUrl: null },
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
  });
});

describe("storyProgress", () => {
  it("counts empty bodies and missing ending labels as needing text", () => {
    const p = storyProgress(graph);
    // opening + pick are written; warm has empty body + no label; loop empty body.
    expect(p.total).toBe(4);
    expect(p.written).toBe(2);
    expect(p.needsText).toBe(2);
  });
});

describe("layoutGraph", () => {
  it("places the start at depth 0 and gives every page a position", () => {
    const l = layoutGraph(graph, "opening");
    expect(l.nodes).toHaveLength(4);
    expect(l.nodes.find((n) => n.key === "opening")!.row).toBe(0);
    expect(l.edges.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run test -w @bedtime-quests/core -- plan-status`
Expected: FAIL.

- [ ] **Step 3: Implement**

`packages/core/src/stories/wizard/plan-status.ts`:

```ts
// packages/core/src/stories/wizard/plan-status.ts
import type { StoryGraph, GraphPage } from "../graph";
import type { SlotRole } from "./types";

export type PageStatus = { role: SlotRole; depth: number };

/** True when a page still needs author text (its body is empty, or an ending
 *  lacks a label, or a fork choice lacks a label). Scene Next labels are auto. */
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
  for (const [key, p] of Object.entries(graph.pages))
    out.set(key, { role: roleOf(p, key === startKey), depth: depth.get(key) ?? 0 });
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

export type LayoutNode = { key: string; row: number; col: number; kind: "scene" | "choice"; isEnding: boolean; endingType: string };
export type LayoutEdge = { from: string; to: string };
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
  for (const [key, p] of Object.entries(graph.pages))
    for (const c of p.choices) edges.push({ from: key, to: c.to });
  return { nodes, edges };
}
```

- [ ] **Step 4: Checkpoint** — `npm run test -w @bedtime-quests/core -- plan-status` PASS.

---

### Task 5: Two-tier validation + content lint

**Files:**
- Create: `packages/core/src/stories/wizard/validate-complete.ts`
- Test: `packages/core/src/stories/wizard/validate-complete.test.ts`

Operates on `StoryInput` (same shape the publish path already builds via `lib/admin/story-to-input.ts`).

- [ ] **Step 1: Write the failing test**

`packages/core/src/stories/wizard/validate-complete.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateStoryComplete, lintStoryContent } from "./validate-complete";
import type { StoryInput } from "../story-types";

const ok: StoryInput = {
  slug: "x", title: "Sleepy Sail", start: "a", ageBand: "2-4",
  pages: {
    a: { body: "Off they go, {{name}}.", choices: [{ label: "Turn the page", to: "b" }] },
    b: { body: "Which way?", choices: [{ label: "Warm", to: "c" }, { label: "Loop", to: "d" }] },
    c: { body: "Cozy and calm.", ending: "The Warm Cloud", endingKind: "good" },
    d: { body: "A giggly loop.", ending: "The Loop", endingKind: "game_over" },
  },
};

describe("validateStoryComplete", () => {
  it("passes a complete, clean story", () => {
    const r = validateStoryComplete(ok);
    expect(r.blocking).toEqual([]);
  });
  it("blocks an empty body", () => {
    const s = structuredClone(ok); s.pages.a.body = "  ";
    expect(validateStoryComplete(s).blocking.join(" ")).toMatch(/needs text/i);
  });
  it("blocks when no good ending is reachable", () => {
    const s = structuredClone(ok); s.pages.c.endingKind = "game_over";
    expect(validateStoryComplete(s).blocking.join(" ")).toMatch(/good ending/i);
  });
  it("blocks a dash in any displayed copy", () => {
    const s = structuredClone(ok); s.pages.b.choices![0].label = "Stay up-late";
    expect(validateStoryComplete(s).blocking.join(" ")).toMatch(/dash/i);
  });
});

describe("lintStoryContent", () => {
  it("warns on a possible child pronoun but does not block", () => {
    const s = structuredClone(ok); s.pages.a.body = "He climbed aboard.";
    const r = validateStoryComplete(s);
    expect(r.warnings.join(" ")).toMatch(/pronoun|he\b/i);
    expect(r.blocking.join(" ")).not.toMatch(/pronoun/i);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `npm run test -w @bedtime-quests/core -- validate-complete`
Expected: FAIL.

- [ ] **Step 3: Implement**

`packages/core/src/stories/wizard/validate-complete.ts`:

```ts
// packages/core/src/stories/wizard/validate-complete.ts
import type { StoryInput } from "../story-types";
import { validateStory } from "../validate";

const DASH = /[‐-―−]|(?<=\S)-(?=\S)| - /; // en/em/hyphen/minus as punctuation
const PRONOUNS = /\b(he|she|him|her|hers|his|boy|girl)\b/i;

type Result = { blocking: string[]; warnings: string[] };

/** Every displayed string in the story, labelled by where it lives. */
function displayedStrings(s: StoryInput): Array<[string, string]> {
  const out: Array<[string, string]> = [["title", s.title], ["description", s.description ?? ""]];
  for (const [key, p] of Object.entries(s.pages)) {
    out.push([`page "${key}"`, p.body]);
    if (p.ending) out.push([`ending label on "${key}"`, p.ending]);
    for (const c of p.choices ?? []) out.push([`choice on "${key}"`, c.label]);
  }
  return out;
}

/** True when a good ending is reachable from the start. */
function goodEndingReachable(s: StoryInput): boolean {
  const seen = new Set<string>();
  const q = [s.start];
  while (q.length) {
    const k = q.shift()!;
    if (seen.has(k)) continue;
    seen.add(k);
    const p = s.pages[k];
    if (!p) continue;
    if (p.ending !== undefined && (p.endingKind ?? "good") === "good") return true;
    for (const c of p.choices ?? []) q.push(c.to);
  }
  return false;
}

export function lintStoryContent(s: StoryInput): Result {
  const blocking: string[] = [];
  const warnings: string[] = [];
  for (const [where, text] of displayedStrings(s)) {
    if (DASH.test(text)) blocking.push(`Remove the dash in the ${where}.`);
    if (PRONOUNS.test(text)) warnings.push(`Check the ${where}: a word like "he" or "she" may stand in for the child.`);
  }
  return { blocking, warnings };
}

export function validateStoryComplete(s: StoryInput): Result {
  const blocking = [...validateStory(s)]; // existing structural checks
  const warnings: string[] = [];

  // Completeness: non-empty bodies, fork labels, ending labels.
  for (const [key, p] of Object.entries(s.pages)) {
    if (p.body.trim() === "") blocking.push(`Page "${key}" needs text.`);
    if (p.ending !== undefined && (p.ending ?? "").trim() === "") blocking.push(`The ending on "${key}" needs a label.`);
    const forks = p.choices ?? [];
    if (forks.length >= 2) for (const c of forks) if (c.label.trim() === "") blocking.push(`A choice on "${key}" needs a label.`);
    if (forks.length > 3) warnings.push(`Page "${key}" has more than three choices; two or three reads best.`);
  }

  if (!goodEndingReachable(s)) blocking.push("At least one good ending must be reachable from the start.");

  const lint = lintStoryContent(s);
  blocking.push(...lint.blocking);
  warnings.push(...lint.warnings);

  return { blocking, warnings };
}
```

> The pronoun and dash regexes are heuristics; keep dashes blocking (clear rule) and pronouns warning (fallible). Verify the `DASH` regex against the seeded stories in a quick manual run so it does not false-positive on legitimate copy.

- [ ] **Step 4: Checkpoint** — `npm run test -w @bedtime-quests/core` (all core) PASS.

---

## Phase 3 — Wizard UI + generation

### Task 6: Server action to generate a scaffold

**Files:**
- Create: `lib/admin/wizard-actions.ts`
- Test: manual (server action verified by running in Task 8).

- [ ] **Step 1: Implement the action**

`lib/admin/wizard-actions.ts`:

```ts
// lib/admin/wizard-actions.ts
"use server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { isValidSlug } from "@bedtime-quests/core/admin/slugs";
import { expandTemplate } from "@bedtime-quests/core/stories/wizard/templates";
import type { TemplateId, AgeBandOrNone } from "@bedtime-quests/core/stories/wizard/types";

const AGE_BANDS = ["2-4", "5-7", "8+"];
const SCENE_NEXT_LABEL = "Turn the page"; // auto label for a scene's single Next

type Input = {
  title: string; slug: string; description: string; ageBand: string | null;
  templateId: TemplateId; good: number; surprise: number;
};

export async function generateFromTemplate(input: Input): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const parent = await getParent();
  if (!parent || !isAdmin(parent.email)) return { ok: false, error: "Not allowed" };

  const title = input.title.trim();
  const slug = input.slug.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (!isValidSlug(slug)) return { ok: false, error: "Slug must be lowercase words joined by single hyphens" };
  if (input.ageBand && !AGE_BANDS.includes(input.ageBand)) return { ok: false, error: "Invalid age band" };

  const [dupe] = await db.select({ id: story.id }).from(story).where(eq(story.slug, slug)).limit(1);
  if (dupe) return { ok: false, error: "That slug is already taken" };

  const scaffold = expandTemplate(input.templateId, {
    ageBand: (input.ageBand ?? null) as AgeBandOrNone, good: input.good, surprise: input.surprise,
  });

  // Insert the story, then its pages, then wire the start page + choices.
  const [created] = await db.insert(story).values({
    slug, title, description: input.description.trim(), ageBand: input.ageBand, published: false,
  }).returning({ id: story.id });

  const idByKey = new Map<string, number>();
  for (const p of scaffold.pages) {
    const [row] = await db.insert(page).values({
      storyId: created.id, key: p.key, body: "",
      isEnding: p.isEnding, endingType: p.endingKind ?? "good", endingLabel: null,
    }).returning({ id: page.id });
    idByKey.set(p.key, row.id);
  }

  // Insert choices directly (NOT via setChoices, which drops empty labels):
  // scene Next choices get the auto label; fork choices start empty for the author.
  const rows = scaffold.pages.flatMap((p) =>
    p.choices.map((c, i) => ({
      pageId: idByKey.get(p.key)!,
      toPageKey: c.toKey,
      label: p.kind === "scene" ? SCENE_NEXT_LABEL : "",
      order: i,
    })),
  );
  if (rows.length) await db.insert(choice).values(rows);

  await db.update(story).set({ startPageId: idByKey.get(scaffold.startKey)! }).where(eq(story.id, created.id));
  return { ok: true, slug };
}
```

- [ ] **Step 2: Checkpoint** — `npm run build` compiles (types line up). Full run happens in Task 8.

---

### Task 7: Template shape component (SVG)

**Files:**
- Create: `components/admin/wizard/template-shape.tsx`

- [ ] **Step 1: Implement a small, presentational SVG** that renders a template's branch shape from a fixed illustrative node list per `TemplateId` (reuse the diagrams from the approved design; colors: start `#16283A`, scene `#5AA9E6`, choice `#8A5CF6`, good `#2FB98A`, surprise `#FFC24B`). This is decorative (author-facing preview), so a hand-authored illustrative shape per template is fine; it need not equal the exact generated graph. Keep every label dash-free. Provide `aria-label` describing the shape.

- [ ] **Step 2: Checkpoint** — `npm run build` compiles.

---

### Task 8: The wizard steps

**Files:**
- Create: `components/admin/wizard/wizard.tsx` (client; holds step state)
- Create: `components/admin/wizard/age-step.tsx`, `endings-step.tsx`, `template-step.tsx`, `title-step.tsx`
- Modify: `app/admin/stories/new/page.tsx` (mount `<Wizard/>`)

- [ ] **Step 1: Build the stepper.** One decision per screen, Paper Cut styling (reuse `field`, `labelCls` from `components/admin/styles.ts`; the chunky button pattern from `new-story-form.tsx`). State: `ageBand`, `{good,surprise}` (seeded from `suggestEndingCounts`), `templateId`, `title`, `slug` (via `slugify`). Steps:
  1. **Age:** four options (`Ages 2 to 4`, `5 to 7`, `8 and up`, `No age band`).
  2. **Endings:** two steppers (Good, Surprise) preseeded from `suggestEndingCounts(ageBand)`, clamped to the returned ranges; show the min-choice-depth note from `minChoicesToGoodEnding`.
  3. **Template:** cards using `<TemplateShape/>`, filtered to recommend by `ageBand` (all selectable); include Blank.
  4. **Title:** title + editable slug (reuse the `slugify`/`isValidSlug` logic from `new-story-form.tsx`); "Create story" button.
- [ ] **Step 2: On submit:** if `templateId === "blank"`, call the existing `createStory` (single empty draft); else call `generateFromTemplate`. On `ok`, `router.push('/admin/stories/'+slug)`.
- [ ] **Step 3: Mount** in `app/admin/stories/new/page.tsx` in place of `<NewStoryForm/>` (keep `new-story-form.tsx` deleted or unused; the wizard's Blank path replaces it).

- [ ] **Step 4: Checkpoint — run it.** `npm run dev`, sign in as an admin (per #85), visit `/admin/stories/new`, walk age → endings → template → title, generate, and confirm you land in the editor with a scaffold of empty pages. Verify at mobile (375px) and desktop widths. `npm run build` passes.

---

## Phase 4 — Enhanced editor

### Task 9: Branch graph component

**Files:**
- Create: `components/admin/story-graph.tsx`
- Modify: `app/admin/stories/[slug]/page.tsx`

- [ ] **Step 1: Implement `<StoryGraph/>`.** Props: the `StoryGraph` + `startKey` + `selectedKey` + `onSelect(key)`. Compute `layoutGraph(graph, startKey)`; map `row`→y (`row * 64`), `col`→x (spread within row width). Draw edges as SVG lines behind rounded-rect nodes. **Color by status** using `pageNeedsText`: written = green `#2FB98A` fill; needs text = white fill + amber dashed border `#E8A100`. Mark type with a glyph (`◆` choice, `★` ending, `🦉` surprise). Selected node gets a navy ring. Nodes are `<button>`-like (role, `cursor-pointer`, focus ring) calling `onSelect`. Provide `aria-label` per node ("Choice 2, needs text").
- [ ] **Step 2: Wire into the editor page** beside the existing panels; clicking a node sets the selected page (scroll to / highlight its `PageEditor`).
- [ ] **Step 3: Checkpoint — run it.** Confirm the graph renders the scaffold, colors match status, and clicking a node focuses its editor. Mobile + desktop.

### Task 10: Completion meter + publish gate

**Files:**
- Create: `components/admin/story-progress.tsx`
- Modify: `app/admin/stories/[slug]/page.tsx`, `components/admin/publish-control.tsx`, `lib/admin-actions.ts`

- [ ] **Step 1: `<StoryProgress/>`** shows `storyProgress(graph)` ("6 of 10 pages written", bar, "K still need text") and renders `validateStoryComplete(storyInput)` as the two-tier "Ready to publish?" panel (Must fix / Worth a look), replacing/extending `ValidationSummary`.
- [ ] **Step 2: Gate publish on the new blocking set.** In `app/admin/stories/[slug]/page.tsx` compute `validateStoryComplete(buildStoryInput(...))`; pass `.blocking` to `PublishControl` (disable when non-empty). In `lib/admin-actions.ts` `setPublished`, replace the `validateStory` call with `validateStoryComplete(...).blocking` so publishing enforces the full set server-side.
- [ ] **Step 3: Checkpoint — run it.** A scaffold with empty pages cannot publish; filling every page + labels clears Must fix and enables Publish; publishing surfaces the story in the public library. Introduce a dash and confirm it blocks.

### Task 11: Ghost-text hints in the editor

**Files:**
- Modify: `components/admin/page-editor.tsx`, `components/admin/choices-editor.tsx`, `app/admin/stories/[slug]/page.tsx`

- [ ] **Step 1: Compute hints.** In the editor page, build `deriveRolesAndDepth(graph, startKey)`; for each page derive its `SlotRole` + depth and call `placeholderFor(role, ageBand, depth)`; for fork choices use `choiceLabelHint(flavor)` (flavor by choice index parity). Pass the hint strings down.
- [ ] **Step 2: Render as ghost text.** Set the body `<textarea>` `placeholder` to the hint (grey, never saved) and each fork choice input `placeholder` to its label hint. Do **not** write hints into `value`.
- [ ] **Step 3: Preserve wired-but-unlabeled choices.** Ensure the choices editor and `setChoices` path keep a choice row that has a destination but an empty label (surface it as needs text) rather than dropping it. If reusing `setChoices` (which filters empties), add a variant or relax the filter to keep rows with a valid `toPageKey`.
- [ ] **Step 4: Checkpoint — run it.** Empty slots show guidance; typing replaces it; saving empties keeps the branch wired and marked needs-text.

---

## Phase 5 — Polish + docs

### Task 12: Template differentiation, AUTHORING update, end-to-end verify

**Files:**
- Modify: `packages/core/src/stories/wizard/templates.ts` (+ tests)
- Modify: `docs/AUTHORING.md`

- [ ] **Step 1: Differentiate the four shapes** while keeping every Task 3 invariant test green: give `two-paths-meet` a genuine reconvergence ("meet") scene, `branching-tree` nested sub-forks, `adventure-trail` a long single spine with side detours, `twin-trails` the compact two-trail shape. Add per-template assertions only where they encode a real requirement (e.g. `two-paths-meet` has a page reached from two choices).
- [ ] **Step 2: Update `docs/AUTHORING.md`:** document the Scene page (single "Next"), the Scene → Choice → Scene rhythm, and that the wizard seeds ghost-text hints. Keep the doc dash-free.
- [ ] **Step 3: Full verification.**
  - `npm run test` (root + core) — PASS.
  - `npm run build` — PASS.
  - Manually walk the wizard for each age band: generate → fill every page → watch the graph go all green and the meter reach 100% → clear validation → preview every path → publish → confirm it reaches the library. Mobile + desktop.
  - Confirm `packages/core` imports remain free of DOM/Next/RN/DB.
- [ ] **Step 4: Stop.** Report results and **wait for the user's explicit approval** before the single `Closes #86` commit on `master`.

---

## Self-review notes (author verification before execution)

- **Spec coverage:** flow (Task 8), zero-schema draft (Task 6 inserts existing tables), rhythm + 3/5/7 depth (Task 3 invariants), ending suggestions (Task 1), templates + Blank (Tasks 3/7/8/12), ghost-text placeholders (Tasks 2/11), graph + status (Tasks 4/9), two-tier validation + tightened publish gate (Tasks 5/10), reuse boundary (Phases 1–2 core vs 3–4 web), productization (approachable step UI, Task 8). Covered.
- **Type consistency:** `Scaffold`/`ScaffoldPage`/`ScaffoldChoice`, `AgeBandOrNone`, `SlotRole`, `TemplateId` defined once in `types.ts` and reused; `expandTemplate`, `placeholderFor`, `suggestEndingCounts`, `minChoicesToGoodEnding`, `layoutGraph`, `storyProgress`, `deriveRolesAndDepth`, `validateStoryComplete`, `lintStoryContent`, `generateFromTemplate` names are stable across tasks.
- **Known refinement risk:** Task 3 ships one shared gauntlet for all four templates; Task 12 differentiates them. Do Task 12 only after Task 3 invariants are green so the shared guarantees are never lost.
```
