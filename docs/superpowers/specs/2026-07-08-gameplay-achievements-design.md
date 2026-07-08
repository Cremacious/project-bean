# Gameplay & Achievements — Design Spec

**Date:** 2026-07-08
**Project:** `project-bean` (Storytime)
**Product sub-project:** #3 of the roadmap (builds on the per-child progress from #1+#2)
**Status:** Approved (design), pending implementation plan

## Purpose

Add the "collect all the good endings" game layer: type endings as good vs game-over, track
per-child completion, celebrate good endings, soften game-overs, and give each child a
**Collection** page (ending counts + milestone badges) to track progress and encourage replay.

## Scope

**In:** ending types (good / game_over), per-child completion + counts, updated ending screens,
the Collection page (per-story counts + milestone badges + stats), demo game-over in the sample
story. **Out:** points/leaderboards, sharing, seasonal events, admin builder, monetization.

## App-wide UI rules (apply here and everywhere)

These are permanent rules (recorded in the "storytime-ui-rules" memory) and are enforced in this
sub-project, including a light compliance pass over existing screens:

1. **No dashes in copy.** No em/en dashes or hyphen punctuation in any displayed text. Ranges
   and compounds are spelled out: **"Ages 2 to 4"** (display), **"game over"**, "try again".
   Internal enum/keys (`good`, `game_over`, ageBand `2-4`) are unaffected.
2. **Every clickable element looks distinctly clickable.** Canonical affordance = the chunky
   Paper Cut button with a solid bottom edge (`shadow-[0_5px_0_...]`, a 3D/pressable look).
   Tappable cards carry a clear affordance (not hover-only). Decorative elements never mimic it.
3. **All text is high-contrast.** No faint/low-opacity text; meet or exceed WCAG AA.

## Ending types & completion

- Each ending page gets a **type**: `good` or `game_over`. New column `page.endingType`
  (`text`, default `"good"`, so existing endings are "good" automatically).
- **Completion of a story (per child) = all of its *good* endings found.**
- Game-overs are **never required**; a story may have zero of them.
- Data: `endingFound` (already `(childId, pageId)`) is unchanged; good vs game-over is known by
  joining to `page.endingType`. Counts, completion, and badges are **queries**, no new tables.

## Ending screens

- **Good ending** (celebratory Paper Cut screen): headline "You found a good ending!", a line
  "That's **X of Y** good endings in <story>", and buttons — a primary **"See my endings"**
  (links to the Collection page), plus "Read again" and "Back to the library". When this is the
  **last** good ending (X = Y), it escalates to a bigger "You finished the whole story!"
  celebration (extra confetti + a completed treatment).
- **Game-over** (gentle): a soft scene, "Oh no! Let's try again," a "Surprise ending found!"
  note, and buttons "Try again" and "Back to the library". Never punishing; recorded as a
  discovered game-over (a "surprise"), never counted toward completion.
- All buttons follow rule 2 (distinct clickable look). All copy follows rule 1 (no dashes).

## Collection page ("My Collection")

Per active child, reached from the header (a clearly tappable header control). Contents:

- **Stats strip:** Endings found · Stories completed · Surprises found.
- **Per-story cards** (the tracker): a colored **cover thumbnail** (reuse the app's `StoryCover`
  treatment), the story title on its own line, and a **progress bar** with a compact "X/Y"
  count. Completed stories get a soft green tint and a check badge on the cover. A small
  "surprise found" indicator appears when the child has hit a game-over in that story.
  Cards are **tappable to open that story** (resume/replay) and carry the clickable affordance
  (rule 2). No ending counts appear on the main library/story-list cards (only here).
- **Milestone badges:** a fixed set, earned ones highlighted, locked ones dimmed (still
  high-contrast, rule 3). Badges are **derived from progress data** (no storage):
  *First ending · First story finished · 3 stories finished · Found a surprise · 10 endings ·
  Collected them all (every story completed)*.

## Story format, validation, seed

- Story files mark each ending's type (default `good`). `validate.ts` checks the value is
  `good` or `game_over` when present.
- Add a demo **game-over** branch to "Bean and the Whispering Woods" so the mechanic is visible,
  and confirm its good-ending count. Copy follows rule 1 (no dashes).
- Seed upserts `page.endingType`.

## Data model changes

- Add `page.endingType` (`text`, default `"good"`). Migration + `db:push`. No new tables.

## Routes

- `/collection` (or `/me`) — the Collection page for the active child.
- Header gains a clearly tappable "My Collection" control.
- The reader ending screen's "See my endings" button routes to `/collection`.

## Existing-app compliance pass (rules 1 to 3)

Small, targeted fixes alongside this work: age-band labels render "Ages 2 to 4" (no hyphen);
scan current copy for stray dashes; confirm library story cards are clearly tappable (rule 2)
and that no text is low-contrast (rule 3).

## Testing

- `computeStoryProgress(endings, foundPageIds)` — pure: good found / good total, completion
  flag, surprises count. TDD.
- `deriveBadges(progressSummary)` — pure: which milestone badges are earned. TDD.
- Ending-type validation (good/game_over) in `validate.test.ts`.

## Build order (phases → detailed in the plan)

1. **Ending types + data:** `page.endingType` column + migration; story format + validation +
   seed (demo game-over in Bean); pure `computeStoryProgress`/`deriveBadges` with tests.
2. **Ending screens:** good-ending "X of Y" + "See my endings", completion celebration, gentle
   game-over; record game-overs as surprises.
3. **Collection page:** stats, per-story progress cards (tappable, cover art, progress bar),
   milestone badges; header link.
4. **Compliance pass:** dashes in copy, age-band display, clickable affordances, contrast.
