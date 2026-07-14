# Bedtime Quests — working conventions

App at `C:\Code\personal\project-bean`. Stack: Next.js 16 (App Router, `params` is a Promise), React 19, Tailwind v4 (Paper Cut design tokens in `app/globals.css`), Drizzle ORM + Neon Postgres, BetterAuth (email/password + Google/Apple), Vitest. Product name: **Bedtime Quests** (repo codename `project-bean`). GitHub repo: **`Cremacious/project-bean`**.

## App-wide UI rules (non-negotiable)

1. **No dashes in displayed copy.** No em dashes, en dashes, or hyphens as punctuation in any user-facing text. Write "Ages 2 to 4", "game over", "try again". Internal keys/enums/slugs (`game_over`, `read_to_me`, `2-4`, page keys) are fine.
2. **Every clickable element looks distinctly clickable.** Canonical affordance: a chunky Paper Cut button/card with a solid bottom edge (`shadow-[0_5px_0_...]`) + `active:translate-y-0.5` + a visible `focus-visible` ring + a **pointer cursor** (`cursor-pointer`) on hover. Non-interactive elements must not mimic this and must keep the default cursor.
3. **All text is high-contrast.** No faint/low-opacity text (no `text-white/20`, etc.). Meet or exceed WCAG AA.

## Issue-driven workflow

Development proceeds issue by issue against `Cremacious/project-bean`.

### Capturing issues
When a message begins with **`issue:`**, everything after it is an issue to file. Immediately create it:
```
gh issue create -R Cremacious/project-bean --title "<concise imperative title>" --body "<cleaned-up description + any inferable context/acceptance criteria>"
```
- Add a sensible existing label (`bug`, `enhancement`, `documentation`) when one applies; otherwise omit.
- Reply with the new issue number + URL. Do NOT start implementing. Several issues may be filed before any are worked.

### Tackling an issue
Issues are worked one at a time, on the user's cue. For the chosen issue, do NOT implement it in the current session. Instead, produce ONE self-contained **Claude Code prompt** (in a copy-friendly code block) for the user to paste into a NEW Claude Code session. That prompt must include:
- the repo path + the stack summary above;
- the issue number, title, and a crisp statement of the change + acceptance criteria;
- a reminder to follow the three UI rules above and to run `npm run test` + `npm run build`;
- the **branch/commit policy (default):** work directly on the default branch (`master`), do NOT create a feature branch, and do NOT commit until the user gives final approval; only then commit with `Closes #N`. (Override only if the user asks.)

## Brand assets (logo & icons)

The logo is a **paper boat with an adventurer's flag, sailing a green sea of stars toward a crescent moon on a deep-navy (`#16283A`) night sky** — quest and choice in the voyage, bedtime in the moon. Colors are literal Paper Cut hex (poppy `#FF6B4A`, sun `#FFC24B`, leaf `#2FB98A`, cream `#FFF1DC`, navy `#16283A`), **not** CSS vars, so every surface renders identically.

All icon files are generated from ONE shared art definition. **Do not hand-edit the generated files.** To change the logo:
1. Edit the `INNER` constant in `scripts/gen-icons.ts`, then run **`npm run gen:icons`**.
2. Paste the same SVG paths into the inline `<BrandMark>` in `components/brand-mark.tsx` (it must stay byte-identical to `INNER`).

What the script produces (art authored in a `0..100` square):
- `app/icon.svg` — web favicon; **rounded** (`rx=22`).
- `app/favicon.ico` — legacy favicon, real 16/32/48 sizes.
- `app/apple-icon.png` — iOS home-screen icon, 180×180.
- `public/brand/app-store-ios-1024.png` (Apple), `google-play-512.png` (Play), `icon-rounded-512.png` (preview), plus `icon-square.svg` / `icon-rounded.svg` sources.
- `apps/mobile/assets/*` — the native Expo icon + splash (issue #57), from the same art: `icon.png` (iOS full-bleed no-alpha), `android-icon-{foreground,background,monochrome}.png` (adaptive icon, navy background, art inset to Android's safe zone), `splash-icon.png` (transparent mark for `expo-splash-screen`, navy background), and `favicon.png`. Wired in `apps/mobile/app.json`; see `apps/mobile/README.md`.

**Rounded vs square is a real distinction, not a bug:** the web favicon and the in-app `<BrandMark>` use rounded corners (`rx=22`); the apple-icon and both store rasters are **full-bleed square (`rx=0`) with NO alpha channel**, because iOS and Play apply their own corner masking and Apple rejects icons with alpha. There is no `app/apple-icon.tsx` — the apple icon is a static PNG (the standard for store submission).

## Design docs
Specs live in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/`, one pair per sub-project.
