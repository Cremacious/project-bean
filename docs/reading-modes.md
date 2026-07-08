# Reading modes

Every child profile has a `readingMode`: **`read_to_me`** or **`can_read`**. This doc is the
source of truth for what each mode actually changes in the app and why it matters. It resolves
issue #2 ("Define what reading modes actually change").

## Why it matters

The two modes describe two genuinely different bedtime situations:

- **Read to me** — a grown-up is the reader. They read the story aloud and tap the choices for
  a child who is too young to read or drive the screen. Wording is aimed at the grown-up.
- **I can read** — an independent young reader is at the wheel. The text needs to be bigger by
  default, the choices need to invite the child to tap them, and the on-screen language talks
  to the child directly.

Before this change the mode was stored per child but changed nothing in the reader (it only
showed as a label on the family page), so the setting was meaningless to families. This makes
it real while staying light for v1 (per the accounts and personalization spec).

## What each mode changes

| | **Read to me** (`read_to_me`) | **I can read** (`can_read`) |
|---|---|---|
| Who reads / taps | Grown-up reads aloud and taps the choices | The child reads and taps the choices themselves |
| Default text size | Medium (`md`) | Large (`lg`) |
| Choice prompt above the options | Quiet grown-up cue: "Let them choose what happens next." | Child-directed cue: "Your turn. Pick one!" |
| Choice buttons | Standard chunky Paper Cut buttons | Same buttons, larger padding and larger label text for small fingers |
| Reading settings (font / size) | Available | Available |

Nothing else differs. Both modes share one reader, one story graph, and the same name
personalization and progress tracking.

### Default text size and explicit overrides

Text size is still a per-child preference (`readerFontSize`) that anyone can change live from
the reading-settings panel, and that choice persists. The mode only sets the **starting
default**:

- A `can_read` child whose size is still the app default (`md`) starts at `lg`.
- Any size the family has explicitly chosen is respected and wins over the mode default.

Practical edge: a `can_read` child who deliberately sets `md` will be nudged back to `lg` on
the next load, because a stored `md` is indistinguishable from "never changed". For v1 we
accept this, biasing independent readers toward larger, easier text.

## UI rules honored

- **No dashes in copy.** All prompts and mode notes avoid em dashes, en dashes, and hyphens as
  punctuation.
- **Clickable vs not.** Choice buttons keep the canonical Paper Cut affordance (solid bottom
  edge, `active:translate-y-0.5`, focus ring). The new prompts are plain, non-interactive text
  and do not mimic that affordance.
- **High contrast.** Prompt text uses `--pc-ink` on the light reader background, meeting WCAG AA.

## Where it lives

- Stored: `child.readingMode` (`db/schema.ts`), set and validated in `lib/children-actions.ts`.
- Chosen: onboarding / family form (`components/profiles/child-form.tsx`), labeled on the
  family page (`components/profiles/child-row.tsx`).
- Applied: the story page (`app/(app)/story/[slug]/page.tsx`) passes `readingMode` and the
  mode-derived initial size to the reader (`components/story/story-reader.tsx`), which renders
  the prompt and choice sizing. The mode default size helper lives in `lib/reading-prefs.ts`.

## Room to deepen later

Kept deliberately small for v1. Natural next steps if we want the modes more distinct:
larger jumbo one-per-row choices, reduced chrome in `can_read`, optional read-aloud audio in
`read_to_me`, or per-mode microcopy throughout the reader.
