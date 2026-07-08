# Gameplay & Achievements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the "collect all the good endings" game layer — typed endings (good vs game over), per-child completion + counts, updated ending screens, and a Collection page (progress + milestone badges) — honoring the three app-wide UI rules.

**Architecture:** One new column (`page.endingType`). All counts/completion/badges are derived by pure functions over existing `endingFound` rows joined to page types — no new tables. Paper Cut UI throughout.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Drizzle/Neon, Vitest.

**Prerequisite:** `master` has sub-projects #1+#2 (accounts, child profiles, personalization, per-child progress).

**App-wide UI rules (enforce in every task):** (1) **No dashes in displayed copy** — write "Ages 2 to 4", "game over", "try again"; internal keys like `game_over`/ageBand `2-4` are fine. (2) **Every clickable element uses the distinct Paper Cut clickable look** (chunky button with `shadow-[0_5px_0_...]`; tappable cards get a clear affordance). (3) **All text high-contrast** (no faint/low-opacity text; >=4.5:1).

**Verification:** subagents verify build/tsc/lint + run logic tests; the controller does the signed-in browser walkthrough.

**Branch:** create `build/gameplay-achievements` off `master` before Task 1 (controller does this).

---

## Phase 1 — Data + pure logic

### Task 1: `page.endingType` column + graph support

**Files:** modify `db/schema.ts`, `lib/stories/graph.ts`, `lib/stories/graph.test.ts`.

- [ ] **Step 1:** In `db/schema.ts` `page`, add after `endingLabel`:
```ts
    endingType: text("ending_type").notNull().default("good"), // "good" | "game_over"
```
- [ ] **Step 2:** `npm run db:generate` && `npm run db:push` (additive column with default; if drizzle-kit hits a rename/interactive prompt, drop-and-recreate is NOT acceptable here since real-ish data may exist — instead accept the additive change; `--force` only if it's a pure add). Verify `page.ending_type` exists via a neon query (read URL from env at runtime).
- [ ] **Step 3:** `lib/stories/graph.ts`: add `endingType: string` to `PageRow` and `GraphPage`; select `endingType` in `loadStoryGraph`; carry it through `buildStoryGraph` (`endingType: p.endingType`). Add a `goodEndings` count to `StoryGraph` alongside `totalEndings` (count pages where `isEnding && endingType === "good"`).
- [ ] **Step 4:** Update `lib/stories/graph.test.ts`: add `endingType` to the `PageRow` fixtures (e.g. the ending page `endingType: "good"`) and assert `graph.pages.b.endingType === "good"` and `graph.goodEndings === 1`. Keep existing assertions.
- [ ] **Step 5:** `npx vitest run lib/stories/graph.test.ts` passes; `npx tsc --noEmit` clean for these files. Commit:
```
git add db/schema.ts drizzle lib/stories/graph.ts lib/stories/graph.test.ts
git commit -m "feat(gameplay): add page.endingType (good/game_over) + graph support"
```

### Task 2: Story format, validation, seed, demo game-over

**Files:** modify `content/stories/_story-types.ts`, `lib/stories/validate.ts`, `lib/stories/validate.test.ts`, `scripts/seed-stories.ts`, `content/stories/bean-whispering-woods.ts`.

- [ ] **Step 1:** `_story-types.ts` `PageInput`: the `ending?` field already marks an ending + label. Add an optional `endingKind?: "good" | "game_over"` (default `good` when the page is an ending). Keep `ending` as the label.
- [ ] **Step 2:** `validate.ts`: when a page is an ending and `endingKind` is present, it must be `"good"` or `"game_over"` (error: `` `page "${key}" endingKind "${p.endingKind}" is not good or game_over` ``). Add a `validate.test.ts` case (good passes, bad flagged).
- [ ] **Step 3:** `seed-stories.ts`: set `endingType` on the seeded page = `p.endingKind ?? "good"` (only meaningful when `isEnding`).
- [ ] **Step 4:** `bean-whispering-woods.ts`: add a **game over** branch so the mechanic is visible. Copy must have NO dashes (rule 1). Example: from `deep-woods`, add a third choice "🦉 Follow the big owl" leading to a new ending page `owl-mixup` with `ending: "The Sleepy Mix Up", endingKind: "game_over"` and body like: "The owl led {{name}} in a big sleepy circle, right back to the start. Let's try again!" Keep the two existing endings as good (default). Bean now has 2 good endings + 1 game over.
- [ ] **Step 5:** `npm run db:seed`; verify Bean has 3 ending pages, one with `ending_type='game_over'`. `npm run test` green. Commit:
```
git add content/stories lib/stories/validate.ts lib/stories/validate.test.ts scripts/seed-stories.ts
git commit -m "feat(content): ending kinds + a gentle game-over in the sample story"
```

### Task 3: Pure progress + badges (TDD)

**Files:** create `lib/gameplay/progress.ts` + `lib/gameplay/progress.test.ts`.

- [ ] **Step 1: Failing test `lib/gameplay/progress.test.ts`:**
```ts
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
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement `lib/gameplay/progress.ts`:**
```ts
// lib/gameplay/progress.ts
export type EndingRef = { pageId: number; endingType: string };
export type StoryProgress = { goodFound: number; goodTotal: number; complete: boolean; surprises: number };

export function computeStoryProgress(endings: EndingRef[], foundPageIds: number[]): StoryProgress {
  const found = new Set(foundPageIds);
  const good = endings.filter((e) => e.endingType === "good");
  const goodFound = good.filter((e) => found.has(e.pageId)).length;
  const surprises = endings.filter((e) => e.endingType === "game_over" && found.has(e.pageId)).length;
  const goodTotal = good.length;
  return { goodFound, goodTotal, complete: goodTotal > 0 && goodFound >= goodTotal, surprises };
}

export type BadgeSummary = { goodEndingsFound: number; storiesCompleted: number; storiesTotal: number; surprisesFound: number };
export type Badge = { id: string; label: string; icon: string; earned: boolean };

// Labels follow rule 1 (no dashes).
export const BADGES: { id: string; label: string; icon: string; test: (s: BadgeSummary) => boolean }[] = [
  { id: "first-ending", label: "First ending", icon: "🌟", test: (s) => s.goodEndingsFound >= 1 },
  { id: "first-story", label: "First story finished", icon: "🏆", test: (s) => s.storiesCompleted >= 1 },
  { id: "three-stories", label: "3 stories finished", icon: "📚", test: (s) => s.storiesCompleted >= 3 },
  { id: "surprise", label: "Found a surprise", icon: "🙈", test: (s) => s.surprisesFound >= 1 },
  { id: "ten-endings", label: "10 endings found", icon: "🔟", test: (s) => s.goodEndingsFound >= 10 },
  { id: "all-stories", label: "Collected them all", icon: "👑", test: (s) => s.storiesTotal > 0 && s.storiesCompleted >= s.storiesTotal },
];

export function deriveBadges(summary: BadgeSummary): Badge[] {
  return BADGES.map(({ id, label, icon, test }) => ({ id, label, icon, earned: test(summary) }));
}
```
- [ ] **Step 4:** Run → PASS; full `npm run test` green. Commit:
```
git add lib/gameplay/progress.ts lib/gameplay/progress.test.ts
git commit -m "feat(gameplay): pure story-progress + badge derivation with tests"
```

---

## Phase 2 — Ending screens + recording

### Task 4: recordEnding returns good-ending progress

**Files:** modify `lib/stories/actions.ts`, `lib/stories/graph.ts` (a helper to load a story's endings).

- [ ] **Step 1:** Add to `lib/stories/graph.ts` a loader `loadStoryEndings(storyId): Promise<EndingRef[]>` returning `{pageId, endingType}` for pages where `isEnding` is true.
- [ ] **Step 2:** Rewrite `recordEnding(slug, pageKey)` in `lib/stories/actions.ts`: resolve active child + story + page (select `id, isEnding, endingType`). If not an ending, return null. Insert `endingFound` (onConflictDoNothing). Then load the story's endings + the child's found pageIds for this story and return `computeStoryProgress(...)` PLUS the reached page's kind:
```ts
return { endingType: pageRow.endingType, ...computeStoryProgress(endings, foundPageIds) };
```
(so the client gets `{endingType, goodFound, goodTotal, complete, surprises}`).
- [ ] **Step 3:** `npx tsc --noEmit` clean. Commit:
```
git add lib/stories/actions.ts lib/stories/graph.ts
git commit -m "feat(gameplay): recordEnding reports good-ending progress + kind"
```

### Task 5: Ending screens (good + game over)

**Files:** modify `components/story/story-reader.tsx`, `components/story/ending-screen.tsx`.

- [ ] **Step 1:** `story-reader.tsx`: the reader already renders `<EndingScreen>` when `current.isEnding`. Pass `current.endingType` (now on the graph) and the `progress` object from `recordEnding` (already stored in state) to `EndingScreen`. Keep the existing `recordEnding(...).then(setProgress)` effect (the returned shape now includes `endingType`/`complete`).
- [ ] **Step 2:** Rewrite `components/story/ending-screen.tsx` to branch on ending kind. Props: `{ endingType: string; endingLabel: string | null; progress: {goodFound:number;goodTotal:number;complete:boolean} | null; onReadAgain: () => void }`.
  - **good ending:** celebratory Paper Cut screen. Headline "You found a good ending!"; line "That's **{goodFound} of {goodTotal}** good endings." When `progress.complete`, escalate: headline "You finished the whole story!" + extra confetti. Buttons (all with the distinct clickable look, rule 2): primary **"See my endings"** → `Link href="/collection"` styled as the primary button; "Read again" (onReadAgain); "Back to the library" → `/`.
  - **game over:** gentle screen. Soft scene, headline "Oh no! Let's try again" (no dashes, rule 1), a "Surprise ending found!" note, buttons "Try again" (onReadAgain) and "Back to the library".
  - All copy: NO dashes. All text high-contrast (rule 3).
- [ ] **Step 3:** Verify build/tsc. Commit:
```
git add components/story/story-reader.tsx components/story/ending-screen.tsx
git commit -m "feat(gameplay): good-ending and gentle game-over ending screens"
```

---

## Phase 3 — Collection page

### Task 6: Collection query

**Files:** create `lib/gameplay/collection.ts`.

- [ ] **Step 1:** `getCollection(childId: number)` returns everything the page needs, computed via `computeStoryProgress`/`deriveBadges`:
```ts
// lib/gameplay/collection.ts
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, endingFound } from "@/db/schema";
import { computeStoryProgress, deriveBadges, type Badge } from "@/lib/gameplay/progress";

export type CollectionStory = {
  slug: string; title: string; ageBand: string | null;
  goodFound: number; goodTotal: number; complete: boolean; surprises: number;
};
export type Collection = {
  stats: { endingsFound: number; storiesCompleted: number; surprises: number };
  stories: CollectionStory[];
  badges: Badge[];
};

export async function getCollection(childId: number): Promise<Collection> {
  const stories = await db.select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand }).from(story).orderBy(story.title);
  const storyIds = stories.map((s) => s.id);
  const endings = storyIds.length
    ? await db.select({ id: page.id, storyId: page.storyId, endingType: page.endingType }).from(page).where(inArray(page.storyId, storyIds))
    : [];
  const found = await db.select({ pageId: endingFound.pageId }).from(endingFound).where(eq(endingFound.childId, childId));
  const foundIds = found.map((f) => f.pageId);
  const endingsByStory = new Map<number, { pageId: number; endingType: string }[]>();
  for (const e of endings) {
    if (!e.endingType) continue; // non-ending pages excluded below
  }
  // Only ending pages have a non-null endingType default "good"; filter to actual endings:
  // (page.isEnding not selected — select it):
  return buildCollection(stories, endings, foundIds);
}
```
Note to implementer: the query above must select `page.isEnding` and keep only ending pages when grouping. Structure `getCollection` so a **pure `buildCollection(stories, endingRows, foundIds)`** does the grouping + `computeStoryProgress` per story + aggregate summary + `deriveBadges`. Put `buildCollection` in this file and unit-test it (add `lib/gameplay/collection.test.ts` with a small fixture asserting stats + per-story progress + earned badges). Aggregate: `endingsFound` = sum of goodFound; `storiesCompleted` = count complete; `surprises` = sum surprises.
- [ ] **Step 2:** Write `collection.test.ts` (TDD the `buildCollection` pure function). Run to pass.
- [ ] **Step 3:** `npx tsc --noEmit` clean. Commit:
```
git add lib/gameplay/collection.ts lib/gameplay/collection.test.ts
git commit -m "feat(gameplay): collection query + buildCollection with tests"
```

### Task 7: Collection page + header link

**Files:** create `app/(app)/collection/page.tsx`, `components/gameplay/collection-view.tsx`, `components/gameplay/story-progress-card.tsx`, `components/gameplay/badge-grid.tsx`; modify `components/app-header.tsx`.

- [ ] **Step 1:** `app/(app)/collection/page.tsx` (server): resolve `getActiveChild()` (redirect to `/` if none), call `getCollection(active.id)`, render `<CollectionView childName={active.name} data={collection} />`.
- [ ] **Step 2:** `collection-view.tsx` — Paper Cut layout matching the approved mock: title "{name}'s Collection", the stats strip (Endings found / Stories finished / Surprises), a list of `<StoryProgressCard>`, and `<BadgeGrid>`. High-contrast text (rule 3).
- [ ] **Step 3:** `story-progress-card.tsx` — the richer card: a `StoryCover` thumbnail (reuse `@/components/story/story-cover`), title on its own line, a progress bar + compact "{goodFound}/{goodTotal}", complete state (green tint + check badge on cover), and a small "1 surprise found" note when `surprises > 0`. The card is a **tappable `Link` to `/story/{slug}`** and MUST carry the distinct clickable affordance (rule 2) — e.g. the paper bottom-edge + active press, or a clear chevron; not hover-only. No dashes in any label.
- [ ] **Step 4:** `badge-grid.tsx` — grid of badges from `data.badges`; earned = colored disc + icon + label, locked = dimmed but still high-contrast (rule 3). No dashes in labels (already handled in `BADGES`).
- [ ] **Step 5:** `app-header.tsx` — add a clearly tappable "My Collection" control (button/link with the distinct clickable look) to the header/account menu, linking to `/collection`.
- [ ] **Step 6:** Controller verifies signed-in. Commit:
```
git add "app/(app)/collection" components/gameplay components/app-header.tsx
git commit -m "feat(gameplay): Collection page (progress cards + badges) + header link"
```

---

## Phase 4 — Compliance pass (rules 1 to 3)

### Task 8: App-wide copy/clickable/contrast sweep

**Files:** various (targeted).

- [ ] **Step 1 (rule 1, dashes):** Grep the app for dashes in displayed strings. Known: the library age-band chip and the age filter render "Ages 2-4" — change display to **"Ages 2 to 4"** (map the stored key `2-4`→`2 to 4`, `5-7`→`5 to 7`, `8+`→`8 and up`). Fix any other hyphen/em-dash punctuation in JSX copy. Do NOT change enum/db keys.
- [ ] **Step 2 (rule 2, clickable):** Audit interactive elements. Ensure library story cards and collection cards read as clearly tappable (distinct affordance, not hover-only). Ensure no purely-decorative element uses the button/tappable look.
- [ ] **Step 3 (rule 3, contrast):** Grep for low-opacity text utilities (e.g. `text-white/`, `/40`, `/50`, `opacity-` on text) and any faint colors; replace with high-contrast tokens. Spot-check key screens.
- [ ] **Step 4:** `npm run test` + `npm run build` green. Controller does the full signed-in walkthrough (good ending shows "X of Y" + See my endings; game over is gentle; Collection page shows progress + badges; per-child independent; age labels read "Ages 2 to 4"). Commit fixes:
```
git commit -am "chore(ui): enforce no-dashes, clickable affordances, high-contrast copy"
```

---

## Self-Review Notes

- Spec coverage: ending types (T1,2) · per-child completion/counts (T3,6) · ending screens (T4,5) · Collection page (T6,7) · badges derived, no tables (T3,6) · demo game-over (T2) · UI rules incl. compliance pass (T8, and enforced in every task).
- Pure logic (`computeStoryProgress`, `deriveBadges`, `buildCollection`) is TDD'd; DB round-trips verified by running.
- No new tables; only `page.endingType`. Migration is a pure additive column with a default (existing endings become "good").
- Rule 1: badge labels + all new copy are dash-free; age-band display mapped to words.
- Rule 2: ending-screen buttons and collection cards use the distinct clickable look.
- Rule 3: no low-opacity text; locked badges dimmed via color, not faint text.
- Base UI Button has no `asChild`; use classed `<Link>`/`<button>`.
