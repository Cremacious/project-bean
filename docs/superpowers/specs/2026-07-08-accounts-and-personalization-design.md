# Accounts, Child Profiles & Name Personalization — Design Spec

**Date:** 2026-07-08
**Project:** `project-bean` (Storytime)
**Product sub-project:** #1 + #2 of the commercialization roadmap (see the "Storytime product vision" memory)
**Status:** Approved (design), pending implementation plan

## Purpose

Turn the single-user personal app into the multi-user foundation of the product: real parent
accounts, multiple child profiles per parent, a global story catalog, and name-based
personalization ("Roleplay") where the active child's name is woven into stories.

This replaces the current single-credential env auth. It is the base layer every later
sub-project (gameplay/achievements, admin builder, monetization, native, Studio) builds on.

## Scope

**In scope:** authentication (email/password + Google + Apple), parent account, child
profiles (name + reading mode), active-child selection, global story catalog with age-band
labels, `{{name}}` personalization in story text, per-child progress tracking, and a family
settings area to manage kids.

**Out of scope (later sub-projects):** payments/ads/RevenueCat/Google Analytics, the admin
story-builder CMS, Mad Libs word-insertion, the achievements *page* and good-vs-game-over
gameplay layer, native apps, and Studio (user-generated stories).

## Compliance posture (carried from product vision)

- Child data is **name only** — no age, no attributes. Reading mode is a parent-set toggle.
- No ads or analytics SDKs are introduced in this sub-project.
- Children are always owned by (nested under) a parent account; there is no child login.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Auth | BetterAuth: email/password **+ Google + Apple** social. |
| Account model | One **parent** account → many **child** profiles. No child login. |
| Child fields | `name`, `readingMode` (`read_to_me` \| `can_read`), plus reading a11y prefs (font/size) moved here from the old reader. |
| Active child | Chosen via a "Who's reading tonight?" picker after login; stored in a signed cookie. Progress is per child. |
| Library | **Single global catalog** — every published story is available to every family. `story_access` is removed. |
| Age band | A parent-facing **label** on each story (`2-4` \| `5-7` \| `8+`); used for filtering/sorting, never tied to a child record. |
| Personalization | Single `{{name}}` placeholder in story text, per-story opt-in, filled from the active child, authored pronoun-free. |

## Authentication

BetterAuth (reintroduced; the project used it before the single-credential simplification):

- **Email/password** — works in dev with no external setup.
- **Google** and **Apple** OAuth — require credentials the user provisions (Google Cloud OAuth
  client; Apple Services ID + key). These are configured via env vars; the social buttons are
  wired but only functional once creds exist. Apple is mandatory once Google is offered (App
  Store rule) — both are included.
- Sessions via BetterAuth's cookie/session. Middleware gates the app; server components resolve
  the parent via `getParent()` (replacing `getReader()`).

Env: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and (optional until provisioned)
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`/`APPLE_CLIENT_SECRET`.

## Data model (Drizzle/Neon)

BetterAuth core tables return: `user` (= **parent**: id, name, email, emailVerified, image,
timestamps), `session`, `account` (holds social provider links + password), `verification`.
The old reader-specific columns (`username`, `displayName`, `theme`, `readerFont`,
`readerFontSize`) are removed from `user`.

New / changed domain tables:

- **`child`** — `id`, `parentId` (→ user.id, cascade), `name`, `readingMode`
  (`text`, default `read_to_me`), `readerFont` (default `rounded`), `readerFontSize`
  (default `md`), `createdAt`.
- **`story`** — unchanged fields plus **`ageBand`** (`text`, e.g. `2-4|5-7|8+`, nullable).
- **`page`**, **`choice`** — unchanged.
- **`endingFound`** — re-keyed from `readerId` to **`childId`** (→ child.id): `(childId, storyId, pageId, foundAt)`.
- **Removed:** `storyAccess`.

Because current DB data is disposable test data, this is a **clean recreate** (regenerate
migrations, push, re-seed stories from files). No data migration needed.

## Active-child selection

- After sign-in: if the parent has **0 children** → onboarding to create the first child; if
  **≥1** → a "Who's reading tonight?" picker (auto-select when there's exactly one).
- The chosen child id is stored in a **signed cookie** (`active_child`), validated server-side
  against the parent's children. `getActiveChild()` returns the active child (or null → send to
  picker). Switching child is available from the header at any time.
- All progress writes (`endingFound`) and name personalization use the active child.

## Name personalization

- Story page bodies may contain the literal token **`{{name}}`**. At render, it is replaced with
  the active child's `name`. A story with no token simply isn't personalized (per-story opt-in;
  no explicit flag needed).
- Interpolation is a **pure function** `personalize(text, name)` (unit-tested), applied where the
  reader renders `page.body` (and any other author-facing text that supports it).
- Authors write **pronoun-free** around the token (guidance documented in the authoring notes),
  since the app never stores gender/pronouns for the child.
- One name slot per story for v1 (no simultaneous two-child reading).

## Library / catalog

- The library lists the **whole published catalog** for the signed-in family (no per-user
  assignment). Each card shows title, description, cover art (existing `StoryCover`), and the
  **age-band label**.
- A simple parent-facing **age-band filter/sort** control (All / 2–4 / 5–7 / 8+).
- Free-vs-paid gating is deferred to the monetization sub-project; for now all stories are open.

## Reading mode

`readingMode` is stored per child and surfaced in the reader:
- `read_to_me` (default): parent-driven; current experience.
- `can_read`: geared to an independent young reader — defaults to a larger reading size and a
  gentle "your turn — you choose!" affordance on the choices.
It is intentionally light in v1 (labeling + a couple of presentation defaults) with room to
deepen later.

## Reused as-is

Paper Cut UI/design system, the story engine (`graph`, `StoryReader`, `ReadingSettings`,
`EndingScreen`), `StoryCover`, and the file-based authoring + `db:seed` pipeline. The reader
now sources the child's name + a11y prefs from the active child, and interpolates `{{name}}`.

## Routes

- `/sign-in`, `/sign-up` — BetterAuth flows with email/password + Google/Apple buttons.
- `/` — resolves active child (onboarding / picker / library).
- `/family` — manage children (add / rename / set reading mode / remove) and account.
- `/story/[slug]` — reader (name-injected, per-child progress).

## Testing

- `personalize()` interpolation — TDD (token replacement, missing token, repeated tokens, empty name).
- Active-child cookie resolution — validated against the parent's children (a child id from
  another parent must be rejected).
- Existing story validation and graph tests carry over; validation gains an optional `ageBand`
  check (must be one of the allowed bands when present).

## Build order (phases → detailed in the plan)

1. **Auth foundation** — BetterAuth (email/password first; social wired), parent session
   helpers, middleware, sign-in/sign-up screens. Replace single-credential auth.
2. **Schema recreate** — parent reshape, `child` table, `endingFound` re-key, `story.ageBand`,
   drop `storyAccess`; regenerate + push; update seed (ageBand, no access).
3. **Child profiles + active selection** — `/family` management, onboarding, "who's reading"
   picker, `active_child` cookie + `getActiveChild()`.
4. **Personalization + catalog** — `personalize()` + reader injection, per-child a11y prefs,
   global library with age-band label + filter, per-child progress.
5. **Social providers + polish** — verify Google/Apple once creds exist; reading-mode presentation.
