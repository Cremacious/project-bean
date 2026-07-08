# Bedtime Quests — working conventions

App at `C:\Code\personal\project-bean`. Stack: Next.js 16 (App Router, `params` is a Promise), React 19, Tailwind v4 (Paper Cut design tokens in `app/globals.css`), Drizzle ORM + Neon Postgres, BetterAuth (email/password + Google/Apple), Vitest. Product name: **Bedtime Quests** (repo codename `project-bean`). GitHub repo: **`Cremacious/project-bean`**.

## App-wide UI rules (non-negotiable)

1. **No dashes in displayed copy.** No em dashes, en dashes, or hyphens as punctuation in any user-facing text. Write "Ages 2 to 4", "game over", "try again". Internal keys/enums/slugs (`game_over`, `read_to_me`, `2-4`, page keys) are fine.
2. **Every clickable element looks distinctly clickable.** Canonical affordance: a chunky Paper Cut button/card with a solid bottom edge (`shadow-[0_5px_0_...]`) + `active:translate-y-0.5` + a visible `focus-visible` ring. Non-interactive elements must not mimic this.
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
- an instruction to branch, and to reference/close the issue in the commit/PR (e.g. `Closes #N`).

## Design docs
Specs live in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/`, one pair per sub-project.
