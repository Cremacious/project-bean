# Paper Cut Redesign — Design Spec

**Date:** 2026-07-08
**Project:** `project-bean` (Storytime)
**Status:** Approved (design), pending implementation plan

## Purpose

Replace the app's bare shadcn-default styling with a complete, consistent, professional
visual identity — **"Paper Cut"** — a cut-paper picture-book aesthetic. The redesign covers
every screen and UI element, adds reader-facing accessibility controls (text size + reading
font), and makes the whole app mobile-first responsive.

## Visual references (approved mockups)

- Direction study (Paper Cut chosen): `https://claude.ai/code/artifact/7719a3a1-8a19-4b0c-9fee-4b5ef3bdc300`
- Mobile + accessibility + ending: `https://claude.ai/code/artifact/88ccd0f8-8bc9-499d-ac59-4f3f27e5c2da`

These are the source of truth for the look; the tokens below encode them.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Visual identity | Single "Paper Cut" system (retire the cozy/playful/calm 3-theme switcher). |
| Type | Baloo 2 (display) + Nunito Sans (body), self-hosted via `next/font`. |
| Reader accessibility | An "Aa" control adjusts **text size** (4 steps) and **reading font** (Rounded / Hyperlegible / OpenDyslexic), applied to story prose only, saved to the reader profile. |
| Responsive | Mobile-first; library 1→2→3 columns; single-column reader at all sizes. |
| Story covers | No illustrations in v1 — covers are generated paper-cut graphics chosen deterministically per story. |
| Contrast | Text-bearing colored surfaces use accessible shades (≥4.5:1); bright shades are for decoration only. |

## Design Tokens

Colors (the palette from the approved mock). Decorative brights + accessible "ink" variants
for text-bearing fills:

```
--sky:      #EAF2FB   /* app background base */
--sky-2:    #DCEAFB
--ink:      #16283A   /* primary text */
--sub:      #5A7089   /* secondary text (meets 4.5:1 on white/sky) */
--card:     #FFFFFF
--line:     #D4E3F2   /* hairlines, borders */

/* Brights — decoration, covers, accents */
--poppy:    #FF6B4A
--leaf:     #2FB98A
--sun:      #FFC24B
--plum:     #6C5CE7

/* Accessible fills for white text (verify ≥4.5:1 with #FFFFFF during build) */
--poppy-ink: #E14A2B
--leaf-ink:  #1E8F6A
--plum-ink:  #574BC0   /* also used as the button "press" shadow */
```

- **Primary action color** = plum (`--plum-ink` fill for white text). Choice buttons alternate
  leaf-ink / poppy-ink fills with white text.
- **Semantic**: success = leaf, celebration = sun; these are separate from the plum accent.
- Radius scale: `--r-sm:10px`, `--r-md:14px`, `--r-lg:18px`, `--r-xl:24px` (cards 18–20, buttons 14–16, sheets 24).
- Shadow: soft elevation `0 10px 22px -14px rgba(22,40,58,.45)`; buttons use a solid "paper" bottom edge (`box-shadow: 0 5px 0 <darker>`).
- Spacing: 4px base scale (4/8/12/16/20/24/32/40).
- Motion: card hover lift, choice press (translateY), page-turn fade between story pages,
  gentle confetti on endings. All gated behind `prefers-reduced-motion: reduce`.

## Typography

- **Baloo 2** (display) — brand, headings, choice buttons, card titles. Weights 600/700/800.
- **Nunito Sans** (body/UI) — descriptions, meta, form fields. Weights 400/600/700.
- Both via `next/font/google` (self-hosted at build; `display: swap`; subset latin).
- **Reading fonts** (story prose only), selectable:
  - *Rounded* — Nunito Sans (default).
  - *Hyperlegible* — Atkinson Hyperlegible via `next/font/google`.
  - *OpenDyslexic* — via `next/font/local`; the `.woff2` (SIL OFL, add to `app/fonts/`) must
    be committed to the repo.
- Type scale (rem): 0.75 / 0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25. Headings get
  `text-wrap: balance`; running text capped ~60–66ch.

## Screens & Components

**Header** — brand (poppy paper-chip mark + "Storytime" in Baloo) on the left; on the right a
compact avatar button that opens a menu with the reader's name and **Sign out**. Collapses
cleanly on mobile (brand + avatar only). Sticky, translucent on scroll in the reader.

**Sign-in** — centered card on the sky ground with a subtle paper-shape motif; Baloo heading
"Storytime", Nunito labels, plum primary "Sign in" button. Error message styled (not raw red).

**Library** — greeting headline "Pick a **story**, Milo!" (highlighted word with a sun
underline swash). Responsive grid: 1 col (phone) → 2 (tablet ≥640px) → 3 (desktop ≥1024px).
Each card: a `StoryCover` graphic, Baloo title, one-line description, and a leaf pill meta
("★ 5 pages · 2 endings"). Cards lift on hover / press on tap; keyboard-focusable.

**StoryCover** — a component that renders a deterministic paper-cut graphic from the story
slug (hash → one of ~5 motif templates: sun+hills, balloon, tide-pool, moon, box/creature ×
a palette rotation). Pure CSS/SVG shapes; no images. Used on cards (and later as the reader
header banner). Keeps a populated library visually varied with zero per-story art.

**Reader** — sticky top bar: back control, story title (truncates), and the **Aa** button.
Single centered column (~60–66ch). Story prose in the selected reading font/size. Choice
buttons are full-width, chunky (Baloo, white text on leaf-ink / poppy-ink, paper bottom edge),
with a small icon chip. Page-to-page transition is a gentle fade.

**Reading settings ("Aa")** — opens a **bottom sheet on mobile**, an **anchored popover on
desktop**. Contents: *Text size* (4 segmented buttons S/M/L/XL, showing an "A" at each size)
and *Reading font* (3 rows: Rounded / Hyperlegible / OpenDyslexic, each with a live sample and
a selected check). Changes apply instantly to the prose and persist to the reader profile.
Dismiss via "Done", scrim tap, or Escape. Fully keyboard-operable; focus trapped while open.

**Ending screen** — a celebratory card: a sun "🎉" badge, "The End" eyebrow, the ending name
in Baloo, a white progress chip ("You've found **1 of 2** endings!"), a row of endings-found
dots (filled = found), and two buttons: primary "Read it again" (plum), secondary "Back to
the library". Paper-confetti animates in on mount (disabled under reduced-motion).

## Reader Accessibility — data & behavior

- New reader columns: `reader_font` (text, default `"rounded"`; one of `rounded|hyperlegible|dyslexic`)
  and `reader_font_size` (text, default `"md"`; one of `sm|md|lg|xl`).
- The reader page loads the saved prefs (via `getReader()` extended, or a dedicated query) and
  passes them to the client reader as initial state.
- A `ReadingSettings` client component holds the live state, applies it to the prose element
  (via `data-font` / `data-size` attributes driving CSS, or inline CSS vars), and calls a
  `setReadingPrefs` server action (fire-and-forget, like the old theme switcher) to persist.
- Size maps to a `{fontSize, lineHeight}` pair per step; font maps to the corresponding
  self-hosted family. Only the prose is affected — UI chrome stays constant.

## Responsive strategy

Mobile-first Tailwind. Breakpoints: base (phone), `sm` 640 (tablet), `lg` 1024 (desktop).
- Library grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Card layout: horizontal (cover beside text) on phone for density; can shift to stacked
  (cover on top) at `sm+` where there's width — implementer's call to match the mock feel.
- Reader column: `max-w-[38rem] mx-auto`, full-width choice buttons; comfortable padding.
- Tap targets ≥ 44px; visible keyboard focus rings everywhere; header avatar menu replaces
  always-on controls on narrow screens.

## Data model changes

- Add `reader_font`, `reader_font_size` columns to `user` (Drizzle migration + `db:push`).
- The `user.theme` column becomes unused (the 3-theme switcher is removed). Leave it in place
  for now (harmless); note it as droppable later.

## Files affected (map)

- **Remove**: `components/theme-switcher.tsx`, `lib/theme.ts`, `lib/theme-actions.ts`, and the
  `data-theme` logic in `app/(app)/layout.tsx`.
- **Fonts**: `app/fonts.ts` (next/font declarations) + `app/fonts/OpenDyslexic-*.woff2`.
- **Tokens**: rewrite the theme section of `app/globals.css` to the single Paper Cut token set,
  mapping shadcn's CSS vars (`--background`, `--primary`, `--secondary`, `--foreground`,
  `--card`, `--border`, `--radius`, …) to Paper Cut so shadcn primitives inherit the look.
- **Restyle**: `app/sign-in/page.tsx`, `app/(app)/layout.tsx` (header), `app/(app)/page.tsx`
  (library), `components/story/story-reader.tsx`, `components/story/ending-screen.tsx`, the
  shadcn `components/ui/*` as needed (button/card variants).
- **New**: `components/story/story-cover.tsx`, `components/story/reading-settings.tsx`,
  `lib/reading-prefs.ts` (types + `setReadingPrefs` action), plus schema + migration for the
  two columns.

## Out of scope (this redesign)

- Real illustrations / AI-generated art (covers stay generated graphics).
- Dark mode / any additional theme (single identity for now).
- New story features (branching, endings logic unchanged).
- Mid-story resume (unchanged).

## Build order (phases → detailed in the plan)

1. **Foundation**: fonts (incl. OpenDyslexic asset), Paper Cut tokens in `globals.css`, remove
   theme switcher, base shadcn variant updates. App looks Paper Cut with no regressions.
2. **Library + StoryCover**: responsive grid, cover component, card design, header/avatar menu.
3. **Reader + accessibility**: reader restyle, `ReadingSettings` (sheet/popover), the two
   profile columns + `setReadingPrefs`, prose size/font application.
4. **Sign-in + Ending**: sign-in restyle; celebratory ending with confetti + reduced-motion.
5. **Responsive & a11y pass**: verify breakpoints, tap targets, focus states, contrast (≥4.5:1
   on text-bearing fills), keyboard operation of the Aa control.
