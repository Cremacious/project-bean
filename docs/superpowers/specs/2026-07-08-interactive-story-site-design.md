# Interactive Story Site — Design Spec

**Date:** 2026-07-08
**Project:** `project-bean`
**Status:** Approved (design), pending implementation plan

## Purpose

A private, personal website that hosts branching "choose-your-own-adventure" children's
stories the author has written. Intended for read-aloud storytime: a parent reads the page
text to a young child and asks the child to pick a choice, which advances the story. The
author will continually add new stories over time.

Not public. Access is gated by sign-in, and each reader sees only the stories written for
them (the author expects to add separate story sets for children on different sides of the
family).

## Tech Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Neon** (serverless Postgres) via **Drizzle ORM**
- **BetterAuth** (email/password)
- Single standalone app in `project-bean` (no relation to the neighboring
  `beehive-books-online` project).

## Core Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth purpose | Per-reader profiles | Story visibility depends on the signed-in reader. |
| Account model | One account per reader | Adult signs in as the child. (Revisit household+profiles later if needed.) |
| Story authoring | Hybrid (C) | Author stories as in-repo files; a seed script upserts them into Neon; the app reads from the DB. |
| Branching model | Branching graph (B) | Choices point to page IDs; different choices may converge on the same page. 2–4 choices per page. |
| State/variables | None (not a stateful engine) | YAGNI for read-aloud children's stories. |
| Illustrations | Text-only for v1 | Schema keeps a nullable `imageUrl` so art can be added later with no migration. |
| Reading state | Track completed endings (C) | Each read starts fresh from page one; record which endings each reader has discovered ("3 of 5 endings found"). No mid-story resume in v1. |
| Theming | 3 themes, cozy default, manual switcher | Cozy Storybook / Bright & Playful / Calm & Modern. Selection saved to reader profile. |
| Reader page rendering | Client Component | Instant choice navigation with no per-tap server round-trip (per author's requirement). |

## Architecture

Single Next.js App Router application.

- **Server Components** handle the library/dashboard: auth gating and data fetching
  (which stories the signed-in reader may see).
- **Client Components** handle the story-reading experience: rendering the current page,
  choice navigation, ending screen. The full story graph for one story is loaded, then
  navigation happens client-side.
- **Seed pipeline:** `scripts/seed-stories.ts` reads story files from
  `/content/stories/*`, validates them, and upserts into Neon. The DB is the runtime
  source of truth; files are the authoring source of truth.

## Data Model (Drizzle)

- **`reader`** — auth user (managed by BetterAuth) + `displayName`, `theme` (default `"cozy"`).
- **`story`** — `id`, `slug`, `title`, `description`, `startPageId`, `coverImageUrl` (nullable), `createdAt`, `updatedAt`.
- **`page`** — `id`, `storyId`, `key` (author-friendly string ID, unique within a story, e.g. `forest-edge`), `body` (story text), `imageUrl` (nullable; unused in v1 UI), `isEnding` (boolean), `endingLabel` (nullable, e.g. "The Snug Ending").
- **`choice`** — `id`, `pageId` (from-page), `toPageKey` (to-page, within the same story), `label` (button text), `order` (int). Graph: multiple choices may share a `toPageKey`.
- **`storyAccess`** — join `(storyId, readerId)`: which readers can see which stories.
- **`endingFound`** — `(readerId, storyId, pageId, foundAt)`: records each ending a reader has reached.

Notes:
- `page.key` is the stable author-facing identifier used in story files and choice targets;
  numeric `page.id` is the DB primary key.
- Ending count for a story = number of `page` rows where `isEnding = true`. A reader's
  progress = distinct `endingFound` rows for that story.

## Story Authoring Format

Each story is one typed file in `/content/stories/`, so broken page references fail at
build/seed time. YAML/JSON remains an acceptable alternative if preferred later; v1 uses
a `.ts` file with a `defineStory()` helper.

```ts
export default defineStory({
  slug: "bean-whispering-woods",
  title: "Bean and the Whispering Woods",
  description: "A little bear explores a magical forest.",
  readers: ["milo", "ava"],        // reader identifiers → seeds storyAccess
  start: "forest-edge",
  pages: {
    "forest-edge": {
      body: "Bean stood at the edge of the whispering woods...",
      choices: [
        { label: "🌲 Step into the woods", to: "deep-woods" },
        { label: "🏡 Go back home", to: "cozy-home" },
      ],
    },
    "cozy-home": { body: "Bean curled up by the fire.", ending: "The Snug Ending" },
    // ...more pages
  },
});
```

The seed script validates: `start` exists, every choice `to` points to a real page, every
non-ending page has at least one choice, every ending page has zero choices, and every
`readers` entry maps to a known reader. Then it upserts story/pages/choices/access.

## Reader Experience & Flow

1. **Sign in** → **Library** (server component): shows only the signed-in reader's
   accessible stories as cover cards.
2. Tap a story → **Reader** (client component) at `/story/[slug]`. Renders the current
   page's text + choice buttons. Current position is reflected in the URL
   (e.g. `?p=forest-edge`) so refresh/bookmark/share works. Choice taps swap pages
   client-side with a gentle fade.
3. Reaching an **ending** page → a warm "The End" screen: ending name, progress note
   ("You've found 3 of 5 endings!"), and **Read again** / **Back to library** buttons.
   Reaching an ending records it to `endingFound` via a server action.
4. **Theme switcher** in the header (Cozy / Playful / Calm), persisted to the reader
   profile; applied via a `data-theme` attribute driving CSS variables.

## Visual Direction

Three selectable themes, cozy as default:
- **Cozy Storybook** — warm cream paper, serif, soft rounded buttons (default).
- **Bright & Playful** — bold gradients, candy-colored chunky buttons, punchy sans-serif.
- **Calm & Modern** — airy whitespace, muted pastels, clean sans-serif.

Reading page priorities: large readable text, large tap targets for small hands, minimal
chrome, one clear illustration slot per page (reserved for post-v1 art).

## Build Order (Phases)

1. Scaffold Next.js + Tailwind + shadcn + Drizzle + Neon connection + BetterAuth.
2. Schema + migrations; seed script + story-file format; one sample story
   ("Bean and the Whispering Woods").
3. Auth + Library page (access-gated to the signed-in reader).
4. Client Reader: page rendering, choice navigation, ending screen, endings tracking.
5. Theming: 3 themes, header switcher, per-profile persistence.

## Out of Scope (v1 / future)

- Illustrations rendering (schema-ready, UI deferred).
- AI-generated illustrations in the authoring flow.
- Mid-story resume ("continue where you left off").
- Stateful adventures (inventory/flags changing later pages).
- In-app admin authoring UI (authoring stays file-based + seed script).
- Household accounts with multiple switchable child profiles.
