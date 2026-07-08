# Admin & Story Builder (MVP) — Design Spec

**Date:** 2026-07-08
**Project:** `project-bean` (Bedtime Quests)
**Product sub-project:** #4 of the roadmap
**Status:** Approved (design), pending implementation plan

## Purpose

Give the author an in-app, admin-only tool to create and edit branching stories, so new
stories can be written and published without editing repo files or running `db:seed`. This is
a **forms-based MVP**; the planning wizard and visual graph canvas are deferred.

## Scope

**In:** admin-gated `/admin`; story CRUD + metadata; draft vs published; a forms-based
page/scene editor (scene body as plain paragraphs with an "Insert {{name}}" button, ending
toggle + type + label, a choices editor, start-page selector); an **admin-only draft preview**
(open the story in the reader in a non-recording preview mode); reuse of the existing
validation on save/publish; publish gated on validity.

**Out (deferred to later specs):** the question-asking wizard/scaffolder, a visual
drag-and-drop graph canvas, drafts/version history, image uploads, rich text formatting
(bold/italic), and any multi-admin roles system.

## App-wide UI rules (enforced here too)

Per the "storytime-ui-rules" memory: (1) no dashes in displayed copy (age bands render
"2 to 4" etc.); (2) every clickable element uses the distinct clickable look; (3) all text
high-contrast. Admin is a utilitarian, desktop-first tool but still follows these.

## Key decisions

| Decision | Choice |
|----------|--------|
| Admin access | `ADMIN_EMAILS` env allowlist; `isAdmin(email)` helper; `/admin` layout 404s non-admins. |
| Draft/publish | New `story.published` boolean (default false). Public catalog + reader show only published; admin sees all. |
| Scene editor | Plain-paragraph textarea + "Insert {{name}}" button. `page.body` stays plain text; reader/`personalize()` unchanged. |
| Editing model | Admin CRUD via server actions writing to existing `story`/`page`/`choice` tables. |
| Validation | Reuse `validateStory` rules against DB data (transform DB story to the validator's input shape). Publish blocked while invalid. |
| Coexistence | File-based `content/stories/*` + `db:seed` still works for dev; CMS is source of truth for stories authored in it. |

## Admin access

- `ADMIN_EMAILS` in `.env.local` (comma-separated, lowercased on compare). Add to `.env.example`.
- `lib/admin.ts`: `isAdmin(email: string): boolean` (parses the env list). Unit-tested (membership, case-insensitivity, empty list).
- `app/admin/layout.tsx` (server): `const parent = await getParent(); if (!parent || !isAdmin(parent.email)) notFound();` so `/admin/*` is invisible to non-admins. (Auth cookie is already required by middleware; this adds the admin check.)

## Data model changes

- Add `story.published` (`boolean`, notNull, default `false`). Migration + `db:push` (additive).
- `getCatalog` and `getStoryBySlug` (public reader path) filter `where published = true`.
  Admin queries do not filter. `/collection` counts should also only consider published
  stories (drafts never appear to families).
- No other schema changes (admin via env; scene bodies stay plain text).

## Admin surface

Routes under `/admin` (all admin-gated by the layout):

- **`/admin`** — story list: title, age band label, a status pill ("Published" / "Draft"),
  edit + a "New story" button.
- **`/admin/stories/new`** — create story metadata (title, slug auto-suggested + editable,
  description, age band select incl. "none", optional cover URL). Creates a draft, then routes
  to the editor.
- **`/admin/stories/[slug]`** — the story editor:
  - **Metadata panel:** edit title/description/age band/cover; **start-page selector**;
    **Publish/Unpublish** control (publish disabled + reasons shown when invalid); Delete story.
  - **Pages panel:** list pages by key; add page; per page: edit key, scene body
    (plain-paragraph textarea + "Insert {{name}}" button), an "This is an ending" toggle
    (when on: ending type good/game over + ending label; choices hidden), and for
    non-ending pages a **choices editor** (rows of `label` + target-page dropdown; add /
    remove / reorder). Delete page.

## Admin preview (draft preview)

Admins can preview any story (including unpublished drafts) without publishing and without
polluting a child's progress:

- Route **`/admin/stories/[slug]/preview`** (admin-gated by the `/admin` layout). Loads the
  story regardless of `published`, builds the graph, and renders the real `StoryReader` in a
  **preview mode**.
- `StoryReader` gains a `preview?: boolean` prop. In preview mode it **does not call
  `recordEnding`** (no progress writes), and the ending screen shows the ending label without
  progress numbers or the "See my endings" link (progress is null in preview). A small
  "Preview" indicator is shown.
- `{{name}}` is filled with a fixed **sample name** ("Sam") so personalization is visible
  without an active child. No active child is required for the preview route.
- The story editor has a **"Preview"** button linking to this route (opens in a new tab).
- The public reader route (`/story/[slug]`) is unchanged: still published-only, still requires
  an active child, still records progress.

## Server actions (admin-gated)

All in `lib/admin-actions.ts` (`"use server"`); each re-checks `isAdmin(getParent().email)`
before mutating, and validates inputs:

- `createStory(meta)` → new draft story (unique slug), returns slug.
- `updateStoryMeta(id, meta)`, `deleteStory(id)`, `setStartPage(storyId, pageKey)`.
- `setPublished(storyId, published)` — when publishing, run validation first; reject if invalid.
- `createPage(storyId, key)`, `updatePage(pageId, {key, body, isEnding, endingType, endingLabel})`,
  `deletePage(pageId)`.
- `setChoices(pageId, choices[])` — replace a page's choices with the given ordered list
  (label + toPageKey), simplest correct approach.

Slugs and page keys are validated for format + uniqueness (slug unique across stories; page
key unique within a story, matching the existing `page_story_key_unq` index).

## Validation

`lib/stories/validate.ts` already validates a `StoryInput`. Add `lib/admin/story-to-input.ts`:
build a `StoryInput`-shaped object from the DB rows (story + pages + choices) and run
`validateStory` on it. Returns the same error strings, surfaced in the editor. Used to:
- show live validity in the editor,
- block `setPublished(..., true)` when there are errors.
Unit-test the transform (a valid DB story yields no errors; a dangling choice yields the
expected error).

## Reused / touched

Reader, catalog, `personalize()`, `StoryCover`, gameplay/collection all unchanged except the
`published` filter on the public catalog/reader/collection queries. `StoryReader` gains a
`preview` prop (non-recording, sample name) reused by the admin preview route. Paper Cut
design system for admin chrome.

## Testing

- `isAdmin()` — unit (membership, case, empty).
- `story-to-input` transform + validation reuse — unit.
- Slug/key uniqueness + format helpers — unit.
- Server-action happy paths verified by running (create a story, add pages/choices, publish,
  confirm it appears in the public catalog; unpublish hides it).

## Build order (phases → detailed in the plan)

1. **Admin foundation:** `ADMIN_EMAILS` + `isAdmin` (tested); `story.published` column +
   migration; filter public catalog/reader/collection to published; `/admin` gated layout +
   empty story-list page.
2. **Story CRUD + metadata:** list, create (new draft), edit metadata, delete, publish toggle
   (validity-gated), start-page selector.
3. **Page/scene editor:** pages list; page form (body + Insert {{name}}, ending toggle/type/
   label); choices editor; deletes. Add the `StoryReader` `preview` prop + the
   `/admin/stories/[slug]/preview` route + a "Preview" button in the editor.
4. **Validation surfacing:** `story-to-input` + reuse `validateStory`; live validity + publish
   gating.
5. **Polish + compliance:** UI rules pass over the admin surface; verify end to end.
