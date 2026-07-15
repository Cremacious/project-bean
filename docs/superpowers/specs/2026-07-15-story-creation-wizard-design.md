# Story Creation Wizard — Design Spec

**Date:** 2026-07-15
**Project:** `project-bean` (Bedtime Quests)
**Issue:** #86
**Status:** Approved (design), pending implementation plan
**Depends on:** #85 (admin panel shell + auth). The wizard lives in the admin area, so #85 lands first.

## Purpose

Give an author a guided planner that structures a branching, choose your own adventure story so
that everything **except the prose** is planned, scaffolded, and tracked for them. The author picks
an age group and an ending count (the wizard suggests one), picks a template shape, and the wizard
generates every page, choice, and ending as empty slots. The author then only writes text into those
slots while a branch graph and a completion meter show what is done and what still needs text. When
every required slot is filled and validation is clear, the story is publishable through the existing
story tooling.

The planning and validation logic is built platform agnostic in `packages/core` so it can later power
an **end user** story maker and the **native** app. The web UI must therefore stay approachable for
non technical people, not just admins.

This supersedes the "question asking wizard / scaffolder" and "visual graph canvas" that the
[admin story builder spec](2026-07-08-admin-story-builder-design.md) explicitly deferred.

## Scope

**In:** a guided creation flow at `/admin/stories/new` (age group → ending count → template →
title → generate); deterministic template expansion into `story`/`page`/`choice` rows; instructional
ghost text placeholders per slot; an enhanced editor at `/admin/stories/[slug]` with a branch graph,
per page status, and a completion meter; a two tier "ready to publish" validation (blocking vs
warning) that extends the current validator; all planning/validation/layout logic in `packages/core`
with unit tests.

**Out (deferred):** the end user facing wizard and the native port (this spec makes them cheap later
but does not build them); AI generated prose; drag and drop graph editing (the graph is a
read/navigate view, not an editor); template authoring UI (templates are defined in code); image
generation.

## App-wide UI rules (enforced here too)

Per the `storytime-ui-rules` memory: (1) **no dashes in displayed copy** (age bands render "Ages 2 to
4", counts render "2 to 3", etc.); (2) **every clickable element** uses the chunky Paper Cut clickable
look with a pointer cursor and a focus ring; (3) **all text high contrast**. Because this UI is the
seed of a future end user tool, approachability is a first class requirement, not just polish.

## Key decisions

| Decision | Choice |
|----------|--------|
| Where it lives | An on ramp: the wizard steps generate a real draft story, then hand off to the enhanced existing editor to fill + publish. No separate parallel surface. |
| Draft persistence | **Zero new schema.** A draft is an unpublished `story` + its `page`/`choice` rows, exactly as today. Everything the wizard tracks is derived from those rows. |
| Story structure | Strict **Scene → Choice → Scene** rhythm. A good ending is gated behind a **minimum choice depth** (3 / 5 / 7 by age band). Surprise endings are gentler early exits. Paths reconverge to bound the tree. |
| Page kinds | A convention over the existing schema: a **Scene** is a page with a single "Next" choice (or zero choices if it is a terminal ending); a **Choice** is a page with 2 or 3 choices. |
| Ending count | Wizard suggests per age band; author adjusts within a range. Hard floor everywhere: at least one good ending. |
| Placeholders | Deterministic, hand written **instructional** hints looked up by (role, age band, depth). Shown as **ghost text**, never saved, so "needs text" stays trivially defined. No AI. |
| Progress | "Needs text" = a page's saved body is empty (or a choice page has an empty choice label). Completion = filled ÷ total, plus validation clear. |
| Validation | Two tiers. **Must fix** (mechanical) blocks Publish; **Worth a look** (heuristic/craft) only warns. Blocking checks are enforced for any story, so publishing stays safe. |
| Reuse boundary | All planning, templates, placeholders, layout math, and validation live in `packages/core` (pure, tested). Only rendering + Drizzle persistence are web. |

## The wizard flow

Two zones. Zone 1 is the new wizard; zone 2 is the enhanced existing editor.

**Zone 1 — Plan (new), at `/admin/stories/new`.** One decision per screen:

1. **Age group** — Ages 2 to 4, 5 to 7, 8 and up, or no age band. Sets tone, defaults, and the
   minimum choice depth.
2. **Ending count** — the wizard preselects a suggested number of good and surprise endings for that
   age (see below); the author can nudge within the allowed range.
3. **Template** — pick a branch shape, drawn as a diagram, sized to the chosen ending count. Includes
   a Blank / Freeform option.
4. **Title + generate** — name the story (slug auto suggested + editable). On generate, the wizard
   expands the template into `story`/`page`/`choice` rows (empty bodies), sets the start page, and
   routes to the editor.

**Zone 2 — Fill + publish (enhanced existing editor), at `/admin/stories/[slug]`.** The author writes
text into the slots. A branch graph colors each page green (has text) or amber (needs text); a meter
tracks completion; the existing preview and publish flow finishes the job. Nothing about publishing is
reinvented.

## Story structure model

### The rhythm rule

**Scene → Choice → Scene → Choice → … → Scene (ending), always.** A reader never meets a choice unless
the page before it was a scene, and every option out of a choice leads into a scene. Endings are just
terminal scenes (the scene after the final choice). Mapped onto the schema with no changes:

- **Scene (continue):** `page` with exactly one `choice` labelled like "Turn the page", pointing to the
  next page. The reader already renders a single choice as one button.
- **Scene (terminal / ending):** `page` with `isEnding = true`, `endingType` good or `game_over`, and
  no choices.
- **Choice:** `page` with 2 or 3 `choice` rows, each pointing to a scene.
- **Opening:** the start page is always a Scene.

A Scene's single "Next" choice label is **auto set at generation** (a fixed, dash free affordance such
as "Turn the page") and is not something the author must write; the author only needs the Scene's
**body**. A Choice page needs its **body** (the prompt) plus a **label for each fork**. So author
authored text is: every page body, every fork choice label, and every ending label.

`docs/AUTHORING.md` will be updated to bless the single "Next" scene page and document the rhythm (the
current craft rule "two or three choices per decision page" applies to Choice pages, not Scene pages).

### Minimum choice depth to a good ending

| Age band | Min choices to a good ending |
|----------|------------------------------|
| Ages 2 to 4 | 3 |
| Ages 5 to 7 | 5 |
| Ages 8 up | 7 |
| No age band | 5 (middle default) |

A good ending sits behind at least this many choice points. Surprise endings may be reached in fewer
(an early wander). Reconvergence keeps this from exploding: early choices change the scene/flavor and
rejoin the river, while the last choices genuinely fork into the different good endings, so which good
ending a reader gets depends on their final choices and every good ending sits behind the full depth.

### Ending count suggestions

| Age band | Good (suggested / range) | Surprise (suggested / range) |
|----------|--------------------------|------------------------------|
| Ages 2 to 4 | 2 / 2 to 3 | 1 / 0 to 2 |
| Ages 5 to 7 | 3 / 2 to 4 | 1 / 0 to 2 |
| Ages 8 up | 3 / 3 to 4 | 2 / 0 to 3 |
| No age band | 3 | 1 |

Hard floor everywhere: **at least one good ending** (a story with none can never be completed or
published).

## Templates

A template is a **branch skeleton generator**: given `(ageBand, goodEndings, surpriseEndings)` it
deterministically emits pages (with keys + roles), choices (wired by key), and ending slots, all with
empty bodies, obeying the rhythm rule and the minimum choice depth. Approximate sizes:

| Template | Ages | Min choices | Total pages | Good | Surprise | ~Read time |
|----------|------|-------------|-------------|------|----------|------------|
| Twin Trails | 2 to 4 | 3 | ~12 to 16 | 2 to 3 | 1 to 2 | ~8 to 12 min |
| Two Paths That Meet | 5 to 7 | 5 | ~20 to 26 | 3 | 1 to 2 | ~12 to 16 min |
| Branching Tree | 5 to 7 / 8 up | 5 to 7 | ~22 to 30 | 3 to 4 | 2 | ~14 to 18 min |
| Adventure Trail | 8 up | 7 | ~28 to 50 | 3 to 4 | 2 to 3 | ~16 to 22 min |
| Blank / Freeform | any | you decide | 1 (start only) | 0 | 0 | you grow it |

Forcing a scene between every choice roughly doubles page counts versus a bare decision tree; this is
deliberate and is what produces a real 10 to 15 minute bedtime story. The wizard may display the
estimated read time as an approachability affordance.

The wizard offers templates recommended for the chosen age + count; every non blank template scales to
the chosen ending count by widening the final fork/fan.

## Placeholders (no AI)

Placeholders are **not generated**. When a template lays down a slot, it knows that slot's **role** and
**position**, and looks up a hand written hint from a table shipped in `packages/core`. Pure function,
deterministic, no network. `placeholderFor(role, ageBand, depth) → string`.

Roles and example instructional hints:

| Slot role | Example hint |
|-----------|--------------|
| Opening scene | Introduce {{name}} and a companion, and set a cozy scene. Where are they as the story begins? |
| Scene (middle) | Describe what they find here. Keep it calm and short. |
| Scene (before a choice) | Set up the decision. End on a gentle question for {{name}}. |
| Choice prompt | Offer two different paths, like a calm one and a curious one. |
| Choice label (calm branch) | e.g. Curl up and rest a while |
| Choice label (curious branch) | e.g. Peek around the corner |
| Good ending | Land somewhere warm and sleepy. A happy finish to collect. |
| Surprise ending | A silly, gentle oops that loops back. Nothing scary. |

Four dials select the hint, all read off the slot: **role**, **depth** (early/middle/late), **branch
flavor** (the template tags one path calm, one curious), and **age band** (simpler wording for 2 to 4).

Hints are shown as **ghost text** in an empty box and are never written to the story body. Result:
"needs text" is simply "saved body is empty", and no half written placeholder can ever reach a
published story. The style is **instructional guidance**, not starter prose, so it can never be
mistaken for finished writing.

## The enhanced editor (graph + status)

At `/admin/stories/[slug]` after generation:

- **Completion meter** (top): "N of M pages written", a progress bar, "K pages still need text", and a
  Publish button that stays disabled ("Fix K to publish") until the Must fix tier is clear.
- **Branch graph** (`components/admin/story-graph.tsx`): the whole story drawn from
  `layoutGraph()`. **Green = text written; white with amber dashes = needs text.** Type is marked with
  small glyphs (◆ choice, ★ ending, 🦉 surprise) so structure and status read at once. Clicking a node
  selects that page and opens it in the editor. The selected node is ringed.
- **Page editor** (the existing page/choice editor, reused): the body shows the wizard's ghost text
  hint; choice rows are pre wired to their destination scenes and show label hints. Saving a page flips
  its node green and advances the meter.

Status color owns the hue (the author's main question is "what still needs writing"); type is conveyed
by glyph. Desktop lays the graph beside the editor; mobile stacks them.

## Validation: "ready to publish"

Extends the current `validateStory`. Returned as `{ blocking: Issue[], warnings: Issue[] }`.

**Must fix — blocks publishing (deterministic, safe for any story):**

- Age band is set (or deliberately none) and the start page exists. *(existing)*
- Every choice points to a real page; every ending page has no choices; every decision page has at
  least one choice. *(existing)*
- **At least one good ending exists and is reachable from the start.**
- **Every page has non empty body text.**
- **Every fork choice has a non empty label.** (Scene "Next" labels are auto set, so they always pass.)
- **Every ending has an ending label.**
- **No dashes** anywhere in displayed copy: title, description, page bodies, choice labels, ending
  labels.

**Worth a look — surfaced, never blocks:**

- A **pronoun / gendered word** for the child may be present (he, she, him, her, his, hers, boy, girl).
  Heuristic (they is allowed for child plus companion), so it warns.
- **Ending count differs from the age band suggestion.**
- A page has **more than three choices** (craft preference).
- **Rhythm slip**: two choices back to back with no scene between (templates never do this; only a hand
  edit can).
- **Orphan page**: a page unreachable from the start.

Tightening the publish gate is intentional and safe: today "no dashes" and "at least one good ending"
are only checklist prose. The two seeded stories already comply. The web publish action enforces the
Must fix tier so publishing is safe regardless of which UI produced the story.

## Reuse boundary

**`packages/core` (`@bedtime-quests/core`) — pure, no DOM/Next/RN/DB, Vitest unit tests:**

- `stories/wizard/endings.ts` — `suggestEndingCounts(ageBand)`, `minChoicesToGoodEnding(ageBand)`.
- `stories/wizard/templates.ts` — the template registry + `expandTemplate(id, { ageBand, goodEndings,
  surpriseEndings })` returning a scaffold (pages/choices/endings with keys, roles, wiring, empty
  bodies).
- `stories/wizard/placeholders.ts` — `placeholderFor(role, ageBand, depth)`, choice label hints; the
  hand written tables.
- `stories/wizard/plan-status.ts` — derive each page's role + depth from the graph; `storyProgress()`
  (written vs needs text); `layoutGraph()` node/edge positions for drawing.
- `stories/wizard/validate-complete.ts` — `validateStoryComplete()` + `lintStoryContent()` (dashes,
  pronouns, reachable good ending, empty bodies, empty choice labels, ending labels, rhythm, orphans),
  split into blocking vs warning.
- Reuses existing `stories/graph.ts`, `stories/validate.ts`, `stories/story-types.ts`.

**Web only — app root (React 19 / Next 16 / Tailwind / Drizzle):**

- `app/admin/stories/new/*` — the wizard step UI (draws the SVG template shapes).
- `lib/admin/wizard-actions.ts` — a `"use server"` action, admin gated, that calls `expandTemplate` and
  inserts the `story`/`page`/`choice` rows (setting `startPageId`). It inserts choice rows **directly**
  (allowing empty labels), because the existing `setChoices` filters empty rows out; wired but
  unlabeled choices must survive as "needs text", not be dropped.
- `components/admin/story-graph.tsx` — renders the graph from `layoutGraph()`, colors by status,
  click to select.
- `components/admin/story-progress.tsx` — completion meter + the "ready to publish" panel wired to
  `validate-complete`.
- Enhanced `app/admin/stories/[slug]/page.tsx` + the existing page editor — graph beside the editor,
  ghost text hints from `placeholders.ts`. The editor must not silently drop a wired choice whose label
  is still empty (surface it as needs text instead).

**Payoff:** the entire core column is platform agnostic, so a future end user wizard and the native
Expo port need only a new UI over the same tested core.

## Productization (approachable enough for end users later)

- One decision per screen, suggested defaults preselected, plain warm language, no jargon.
- Templates shown as pictures, not tree notation.
- Progress as "6 of 10 pages written", not percentages or validator jargon.
- Ghost text guidance in every slot so a blank canvas is never intimidating.
- The reusable core means the end user version is a re skin + gating, not a rebuild.

## Testing

- `endings` suggestions + min depth — unit (each band, ranges, no age band, floor of one good).
- `templates` expansion — unit: for each template + count, the scaffold obeys the rhythm rule, hits the
  minimum choice depth for every good ending, wires only to existing keys, and has the requested ending
  counts. Feed each scaffold through `validateStory` and confirm it is structurally valid (empty
  bodies aside).
- `placeholders` — unit: deterministic output per (role, age, depth); dash free.
- `plan-status` — unit: role/depth derivation, progress counts, `layoutGraph` (no overlaps, start at
  top, endings at leaves).
- `validate-complete` + `lintStoryContent` — unit: each blocking and warning check fires and clears as
  expected; a fully filled scaffold passes.
- Web: `wizard-actions` happy path by running it (generate from each template, confirm rows + start
  page; fill a story end to end; confirm graph + meter behave; publish; confirm it reaches the public
  library) at mobile and desktop widths.
- `npm run test` and `npm run build` pass; core stays free of DOM/Next/RN/DB imports.

## Build order (phases → detailed in the plan)

1. **Core planning primitives:** `endings`, `placeholders`, and `templates` (+ `expandTemplate`) with
   unit tests. No UI yet.
2. **Core status + validation:** `plan-status` (role/depth, progress, `layoutGraph`) and
   `validate-complete` / `lintStoryContent`, with unit tests.
3. **Wizard UI + generation:** `/admin/stories/new` steps + `lib/admin/wizard-actions.ts` that expands
   a template into rows and routes to the editor.
4. **Enhanced editor:** `story-graph` + `story-progress` components; ghost text hints in the page
   editor; wire the two tier validation into the publish gate.
5. **Polish + docs:** UI rules pass; update `docs/AUTHORING.md` (scene pages + rhythm); verify the full
   walk end to end at mobile and desktop widths.
