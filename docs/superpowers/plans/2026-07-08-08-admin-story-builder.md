# Admin & Story Builder (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an admin-only, forms-based CMS at `/admin` so the author can create, edit, validate, and publish branching stories without editing repo files or running `db:seed`.

**Architecture:** Env allowlist (`ADMIN_EMAILS` + `isAdmin`) gates an `app/admin/*` layout. A new `story.published` boolean splits drafts from live stories; the public catalog, reader, and collection queries filter to published. Admin mutations are server actions writing the existing `story`/`page`/`choice` tables. Publishing reuses the existing `validateStory` by transforming DB rows back into a `StoryInput`. No new tables beyond the one `published` column; scene bodies stay plain text.

**Tech Stack:** Next.js 16.2 (App Router, server actions), React 19, Tailwind v4 (Paper Cut tokens), Drizzle + Neon, Vitest.

**Prerequisite:** `master` has sub-projects #1 to #3 (accounts, child profiles, personalization, gameplay/collection). `page.endingType` and `endingKind` already exist. `story.published` does NOT yet exist.

**Design spec:** `docs/superpowers/specs/2026-07-08-admin-story-builder-design.md`.

**App-wide UI rules (enforce in every task):** (1) **No dashes in displayed copy** — internal keys/slugs like `game_over` or `whispering-woods` are fine, but visible text must not use hyphen/em-dash punctuation (age bands render "2 to 4"). (2) **Every clickable element uses the distinct Paper Cut clickable look** (chunky button / card with `shadow-[0_5px_0_...]` + `active:translate-y`). (3) **All text high-contrast** (no faint/low-opacity text; use `--pc-ink`/`--pc-sub`, not white-alpha).

**Branch:** create `build/admin-story-builder` off `master` before Task 1 (controller does this).

**Verification:** subagents run `npm run test` + `npx tsc --noEmit` + `npm run build`; the controller does the signed-in admin browser walkthrough (create story, add pages/choices, fix validation, publish, confirm it appears in the public catalog, unpublish hides it).

---

## Phase 0 — Preflight

### Task 0: Read the Next.js docs, then branch

**Files:** none (research + branch).

- [ ] **Step 1:** Per `AGENTS.md`, this Next.js differs from training data. Before writing any route/layout/action code, read the relevant guides in `node_modules/next/dist/docs/` — specifically App Router **layouts**, **pages & dynamic routes** (note the `params` is a Promise: `const { slug } = await params`), **server actions / mutations** (`"use server"`), and **`notFound()` / `redirect()`**. Confirm the `params` pattern against the existing `app/(app)/story/[slug]/page.tsx`.
- [ ] **Step 2:** Controller creates the branch:
```bash
git checkout master && git checkout -b build/admin-story-builder
```

---

## Phase 1 — Admin foundation

### Task 1: `story.published` column + public filters

**Files:** modify `db/schema.ts`, `scripts/seed-stories.ts`, `lib/stories/queries.ts`, `lib/gameplay/collection.ts`.

- [ ] **Step 1:** In `db/schema.ts` `story`, add after `coverImageUrl`:
```ts
    published: boolean("published").notNull().default(false),
```
- [ ] **Step 2:** Generate + push the additive column:
```bash
npm run db:generate && npm run db:push
```
Expected: a new migration adding `published boolean not null default false`. It is a pure add with a default, so existing rows get `false`. If drizzle-kit prompts interactively, accept the additive change only; NEVER drop/recreate `story` (real-ish data exists). Confirm the column exists with a quick Neon query (read `DATABASE_URL` from env at runtime).
- [ ] **Step 3:** So seeded/dev stories stay visible, make the seed publish them. In `scripts/seed-stories.ts`, wherever a story row is inserted/upserted, set `published: true` in the values (and in the update branch if it upserts). If the seed builds a values object, add `published: true`.
- [ ] **Step 4:** Filter the public catalog to published. In `lib/stories/queries.ts`:
```ts
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story } from "@/db/schema";

export type StoryCard = { id: number; slug: string; title: string; description: string; ageBand: string | null };

/** All PUBLISHED stories, optionally filtered by age band. */
export async function getCatalog(ageBand?: string): Promise<StoryCard[]> {
  const cols = { id: story.id, slug: story.slug, title: story.title, description: story.description, ageBand: story.ageBand };
  const where = ageBand ? and(eq(story.published, true), eq(story.ageBand, ageBand)) : eq(story.published, true);
  return db.select(cols).from(story).where(where).orderBy(asc(story.title));
}

/** A PUBLISHED story by slug (public reader path), or null. */
export async function getStoryBySlug(slug: string) {
  const [row] = await db
    .select({ id: story.id, slug: story.slug, title: story.title, startPageId: story.startPageId })
    .from(story).where(and(eq(story.slug, slug), eq(story.published, true))).limit(1);
  return row ?? null;
}
```
- [ ] **Step 5:** Drafts must not count in `/collection`. In `lib/gameplay/collection.ts` `getCollection`, filter the stories select to published:
```ts
import { and, eq, inArray, asc } from "drizzle-orm";
// ...
  const stories = await db
    .select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand })
    .from(story).where(eq(story.published, true)).orderBy(asc(story.title));
```
(Leave `buildCollection` and its test unchanged — the filter is at the query, not the pure function.)
- [ ] **Step 6:** `npm run db:seed` (re-seeds with `published: true`), then `npm run test` and `npx tsc --noEmit` clean. Verify the home catalog still shows the seeded stories. Commit:
```bash
git add db/schema.ts drizzle scripts/seed-stories.ts lib/stories/queries.ts lib/gameplay/collection.ts
git commit -m "feat(admin): add story.published + filter public catalog, reader, collection"
```

### Task 2: `isAdmin` allowlist (TDD)

**Files:** create `lib/admin.ts` + `lib/admin.test.ts`; modify `.env.example`.

- [ ] **Step 1: Failing test `lib/admin.test.ts`:**
```ts
import { describe, it, expect, afterEach, vi } from "vitest";
import { isAdmin } from "./admin";

afterEach(() => vi.unstubAllEnvs());

describe("isAdmin", () => {
  it("matches an allowlisted email, case-insensitively and trimmed", () => {
    vi.stubEnv("ADMIN_EMAILS", "chrismackall3@gmail.com, Second@Example.com");
    expect(isAdmin("chrismackall3@gmail.com")).toBe(true);
    expect(isAdmin("  SECOND@example.com ")).toBe(true);
  });
  it("rejects non-listed emails", () => {
    vi.stubEnv("ADMIN_EMAILS", "chrismackall3@gmail.com");
    expect(isAdmin("someone@else.com")).toBe(false);
  });
  it("returns false when the list is empty or unset", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin("chrismackall3@gmail.com")).toBe(false);
  });
});
```
- [ ] **Step 2:** Run → FAIL:
```bash
npx vitest run lib/admin.test.ts
```
- [ ] **Step 3: Implement `lib/admin.ts`:**
```ts
// lib/admin.ts
/** Parse ADMIN_EMAILS (comma-separated) into a lowercased set at call time. */
function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

/** True if the email is on the ADMIN_EMAILS allowlist. */
export function isAdmin(email: string): boolean {
  return adminEmails().has(email.trim().toLowerCase());
}
```
- [ ] **Step 4:** Run → PASS. `npx tsc --noEmit` clean.
- [ ] **Step 5:** Add to `.env.example`:
```
# Comma-separated emails allowed into /admin
ADMIN_EMAILS=
```
Also add your email to `.env.local` (`ADMIN_EMAILS=chrismackall3@gmail.com`) for local testing (do NOT commit `.env.local`).
- [ ] **Step 6:** Commit:
```bash
git add lib/admin.ts lib/admin.test.ts .env.example
git commit -m "feat(admin): isAdmin allowlist from ADMIN_EMAILS (tested)"
```

### Task 3: Admin-gated layout + admin query loader + story list

**Files:** create `app/admin/layout.tsx`, `app/admin/page.tsx`, `lib/admin/queries.ts`.

- [ ] **Step 1: `lib/admin/queries.ts`** (admin reads — UNfiltered by published):
```ts
// lib/admin/queries.ts
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";

export type AdminStoryListItem = { id: number; slug: string; title: string; ageBand: string | null; published: boolean };

export async function listAdminStories(): Promise<AdminStoryListItem[]> {
  return db
    .select({ id: story.id, slug: story.slug, title: story.title, ageBand: story.ageBand, published: story.published })
    .from(story).orderBy(asc(story.title));
}

export type AdminStory = typeof story.$inferSelect;
export type AdminPage = typeof page.$inferSelect;
export type AdminChoice = typeof choice.$inferSelect;

export async function getAdminStory(slug: string): Promise<AdminStory | null> {
  const [row] = await db.select().from(story).where(eq(story.slug, slug)).limit(1);
  return row ?? null;
}

export async function listPages(storyId: number): Promise<AdminPage[]> {
  return db.select().from(page).where(eq(page.storyId, storyId)).orderBy(asc(page.id));
}

export async function listChoices(storyId: number): Promise<AdminChoice[]> {
  const pages = await db.select({ id: page.id }).from(page).where(eq(page.storyId, storyId));
  const ids = new Set(pages.map((p) => p.id));
  if (ids.size === 0) return [];
  const all = await db.select().from(choice).orderBy(asc(choice.order));
  return all.filter((c) => ids.has(c.pageId));
}
```
- [ ] **Step 2: `app/admin/layout.tsx`** (self-gating; `/admin` is outside the `(app)` group so it does not inherit that layout):
```tsx
// app/admin/layout.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const parent = await getParent();
  if (!parent || !isAdmin(parent.email)) notFound();

  return (
    <div className="min-h-screen bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <header className="border-b border-[var(--pc-line)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
            Bedtime Quests Admin
          </Link>
          <Link href="/" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">
            Back to the app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
```
- [ ] **Step 3: `app/admin/page.tsx`** (story list):
```tsx
// app/admin/page.tsx
import Link from "next/link";
import { listAdminStories } from "@/lib/admin/queries";

const AGE_LABELS: Record<string, string> = { "2-4": "2 to 4", "5-7": "5 to 7", "8+": "8 and up" };

export default async function AdminHome() {
  const stories = await listAdminStories();
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Stories</h1>
        <Link
          href="/admin/stories/new"
          className="rounded-2xl bg-[var(--pc-plum)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
        >
          New story
        </Link>
      </div>

      {stories.length === 0 ? (
        <p className="text-[var(--pc-sub)]">No stories yet. Create your first one.</p>
      ) : (
        <ul className="space-y-2">
          {stories.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/stories/${s.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-bold">{s.title}</span>
                  <span className="text-xs text-[var(--pc-sub)]">
                    {s.ageBand ? `Ages ${AGE_LABELS[s.ageBand] ?? s.ageBand}` : "No age band"}
                  </span>
                </span>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    s.published ? "bg-[#E6F7F0] text-[var(--pc-leaf-ink)]" : "bg-[#FDECEC] text-[var(--pc-poppy-ink)]"
                  }`}
                >
                  {s.published ? "Published" : "Draft"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```
- [ ] **Step 4:** `npx tsc --noEmit` + `npm run build` clean. Controller verifies (signed in as an `ADMIN_EMAILS` account): `/admin` shows the story list; signed in as a NON-admin, `/admin` returns 404. Commit:
```bash
git add app/admin lib/admin/queries.ts
git commit -m "feat(admin): gated /admin layout + story list"
```

---

## Phase 2 — Story CRUD, metadata, publish

### Task 4: Slug & page-key validators (TDD)

**Files:** create `lib/admin/slugs.ts` + `lib/admin/slugs.test.ts`.

- [ ] **Step 1: Failing test `lib/admin/slugs.test.ts`:**
```ts
import { describe, it, expect } from "vitest";
import { isValidSlug, slugify } from "./slugs";

describe("isValidSlug", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    expect(isValidSlug("whispering-woods")).toBe(true);
    expect(isValidSlug("bean")).toBe(true);
  });
  it("rejects spaces, caps, leading/trailing/double hyphens, empty", () => {
    for (const bad of ["", "Bean", "two words", "-bean", "bean-", "a--b", "bean!"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });
});

describe("slugify", () => {
  it("turns a title into a valid slug", () => {
    expect(slugify("The Whispering Woods!")).toBe("the-whispering-woods");
    expect(slugify("  Bean & Friends  ")).toBe("bean-friends");
  });
});
```
- [ ] **Step 2:** Run → FAIL: `npx vitest run lib/admin/slugs.test.ts`
- [ ] **Step 3: Implement `lib/admin/slugs.ts`:**
```ts
// lib/admin/slugs.ts
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Valid slug/page-key: lowercase alphanumerics joined by single hyphens. */
export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

/** Best-effort conversion of free text to a valid slug. May be empty. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```
- [ ] **Step 4:** Run → PASS. Commit:
```bash
git add lib/admin/slugs.ts lib/admin/slugs.test.ts
git commit -m "feat(admin): slug/page-key validation helpers (tested)"
```

### Task 5: DB-to-StoryInput transform for validation reuse (TDD)

**Files:** create `lib/admin/story-to-input.ts` + `lib/admin/story-to-input.test.ts`.

- [ ] **Step 1: Failing test `lib/admin/story-to-input.test.ts`:**
```ts
import { describe, it, expect } from "vitest";
import { buildStoryInput } from "./story-to-input";
import { validateStory } from "@/lib/stories/validate";

const storyRow = { id: 1, slug: "bean", title: "Bean", description: "", ageBand: "2-4" as string | null, startPageId: 10, coverImageUrl: null, published: false };
const pages = [
  { id: 10, storyId: 1, key: "start", body: "Hello {{name}}", imageUrl: null, isEnding: false, endingLabel: null, endingType: "good" },
  { id: 11, storyId: 1, key: "good", body: "The end", imageUrl: null, isEnding: true, endingLabel: "A happy ending", endingType: "good" },
];
const choices = [{ id: 1, pageId: 10, toPageKey: "good", label: "Finish", order: 0 }];

describe("buildStoryInput", () => {
  it("produces a StoryInput that validateStory accepts", () => {
    const input = buildStoryInput(storyRow, pages, choices);
    expect(input.start).toBe("start");
    expect(input.pages.good.ending).toBe("A happy ending");
    expect(input.pages.good.endingKind).toBe("good");
    expect(input.pages.start.choices).toEqual([{ label: "Finish", to: "good" }]);
    expect(validateStory(input)).toEqual([]);
  });
  it("surfaces a dangling choice as a validation error", () => {
    const bad = buildStoryInput(storyRow, pages, [{ id: 2, pageId: 10, toPageKey: "missing", label: "Go", order: 0 }]);
    expect(validateStory(bad).some((e) => e.includes("missing"))).toBe(true);
  });
  it("an unset start page fails validation", () => {
    const noStart = buildStoryInput({ ...storyRow, startPageId: null }, pages, choices);
    expect(validateStory(noStart).some((e) => e.includes("start page"))).toBe(true);
  });
});
```
- [ ] **Step 2:** Run → FAIL: `npx vitest run lib/admin/story-to-input.test.ts`
- [ ] **Step 3: Implement `lib/admin/story-to-input.ts`:**
```ts
// lib/admin/story-to-input.ts
import type { StoryInput, PageInput } from "@/content/stories/_story-types";
import type { AdminStory, AdminPage, AdminChoice } from "@/lib/admin/queries";

/** Pure: rebuild the StoryInput the validator expects from DB rows. */
export function buildStoryInput(story: AdminStory, pages: AdminPage[], choices: AdminChoice[]): StoryInput {
  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? "";
  const choicesByPage = new Map<number, AdminChoice[]>();
  for (const c of choices) {
    const arr = choicesByPage.get(c.pageId) ?? [];
    arr.push(c);
    choicesByPage.set(c.pageId, arr);
  }

  const pageEntries: Record<string, PageInput> = {};
  for (const p of pages) {
    if (p.isEnding) {
      pageEntries[p.key] = {
        body: p.body,
        ending: p.endingLabel ?? "", // presence (even "") marks an ending for the validator
        endingKind: p.endingType === "game_over" ? "game_over" : "good",
      };
    } else {
      const rows = (choicesByPage.get(p.id) ?? []).slice().sort((a, b) => a.order - b.order);
      pageEntries[p.key] = { body: p.body, choices: rows.map((c) => ({ label: c.label, to: c.toPageKey })) };
    }
  }

  return {
    slug: story.slug,
    title: story.title,
    description: story.description,
    ageBand: (story.ageBand ?? undefined) as StoryInput["ageBand"],
    start: startKey,
    coverImageUrl: story.coverImageUrl ?? undefined,
    pages: pageEntries,
  };
}
```
- [ ] **Step 4:** Run → PASS; full `npm run test` green. Commit:
```bash
git add lib/admin/story-to-input.ts lib/admin/story-to-input.test.ts
git commit -m "feat(admin): DB-to-StoryInput transform reusing validateStory (tested)"
```

### Task 6: Story-level server actions

**Files:** create `lib/admin-actions.ts`.

- [ ] **Step 1: Implement `lib/admin-actions.ts`** (each action re-checks admin before mutating):
```ts
// lib/admin-actions.ts
"use server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { story, page, choice } from "@/db/schema";
import { getParent } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { isValidSlug } from "@/lib/admin/slugs";
import { buildStoryInput } from "@/lib/admin/story-to-input";
import { validateStory } from "@/lib/stories/validate";

async function requireAdmin(): Promise<boolean> {
  const parent = await getParent();
  return !!parent && isAdmin(parent.email);
}

const AGE_BANDS = ["2-4", "5-7", "8+"];
type StoryMeta = { title: string; slug: string; description: string; ageBand: string | null; coverImageUrl: string | null };

export async function createStory(meta: StoryMeta): Promise<{ ok: boolean; slug?: string; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  const title = meta.title.trim();
  const slug = meta.slug.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (!isValidSlug(slug)) return { ok: false, error: "Slug must be lowercase words joined by single hyphens" };
  if (meta.ageBand && !AGE_BANDS.includes(meta.ageBand)) return { ok: false, error: "Invalid age band" };
  const [dupe] = await db.select({ id: story.id }).from(story).where(eq(story.slug, slug)).limit(1);
  if (dupe) return { ok: false, error: "That slug is already taken" };
  await db.insert(story).values({
    slug, title, description: meta.description.trim(), ageBand: meta.ageBand,
    coverImageUrl: meta.coverImageUrl?.trim() || null, published: false,
  });
  return { ok: true, slug };
}

export async function updateStoryMeta(storyId: number, meta: Omit<StoryMeta, "slug">): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  const title = meta.title.trim();
  if (!title) return { ok: false, error: "Title is required" };
  if (meta.ageBand && !AGE_BANDS.includes(meta.ageBand)) return { ok: false, error: "Invalid age band" };
  await db.update(story).set({
    title, description: meta.description.trim(), ageBand: meta.ageBand,
    coverImageUrl: meta.coverImageUrl?.trim() || null, updatedAt: new Date(),
  }).where(eq(story.id, storyId));
  return { ok: true };
}

export async function deleteStory(storyId: number): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  await db.delete(story).where(eq(story.id, storyId)); // pages/choices cascade
  return { ok: true };
}

export async function setStartPage(storyId: number, pageKey: string): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  const [p] = await db.select({ id: page.id }).from(page).where(and(eq(page.storyId, storyId), eq(page.key, pageKey))).limit(1);
  if (!p) return { ok: false };
  await db.update(story).set({ startPageId: p.id, updatedAt: new Date() }).where(eq(story.id, storyId));
  return { ok: true };
}

/** Publish only when valid; unpublish always allowed. Returns validation errors when blocking. */
export async function setPublished(storyId: number, published: boolean): Promise<{ ok: boolean; errors?: string[] }> {
  if (!(await requireAdmin())) return { ok: false };
  if (published) {
    const [s] = await db.select().from(story).where(eq(story.id, storyId)).limit(1);
    if (!s) return { ok: false };
    const pages = await db.select().from(page).where(eq(page.storyId, storyId));
    const pageIds = new Set(pages.map((p) => p.id));
    const allChoices = await db.select().from(choice);
    const choices = allChoices.filter((c) => pageIds.has(c.pageId));
    const errors = validateStory(buildStoryInput(s, pages, choices));
    if (errors.length) return { ok: false, errors };
  }
  await db.update(story).set({ published, updatedAt: new Date() }).where(eq(story.id, storyId));
  return { ok: true };
}
```
- [ ] **Step 2:** `npx tsc --noEmit` clean. Commit:
```bash
git add lib/admin-actions.ts
git commit -m "feat(admin): story CRUD + publish server actions (admin-gated)"
```

### Task 7: New-story page + form

**Files:** create `app/admin/stories/new/page.tsx`, `components/admin/new-story-form.tsx`.

- [ ] **Step 1: `components/admin/new-story-form.tsx`** (client):
```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStory } from "@/lib/admin-actions";
import { slugify } from "@/lib/admin/slugs";

const AGE_OPTIONS = [
  { value: "", label: "No age band" },
  { value: "2-4", label: "Ages 2 to 4" },
  { value: "5-7", label: "Ages 5 to 7" },
  { value: "8+", label: "Ages 8 and up" },
];
const field =
  "h-11 w-full rounded-2xl border border-[var(--pc-line)] bg-white px-4 text-base font-semibold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
const labelCls = "text-sm font-bold text-[var(--pc-ink)]";

export function NewStoryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createStory({ title, slug, description, ageBand: ageBand || null, coverImageUrl: null });
      if (res.ok && res.slug) router.push(`/admin/stories/${res.slug}`);
      else setError(res.error ?? "Something went wrong");
    });
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="t" className={labelCls}>Title</label>
        <input id="t" className={field} value={title} maxLength={80} onChange={(e) => onTitle(e.target.value)} placeholder="The Whispering Woods" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="s" className={labelCls}>Slug</label>
        <input id="s" className={field} value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} placeholder="whispering-woods" disabled={isPending} />
        <p className="text-xs text-[var(--pc-sub)]">Lowercase words joined by single hyphens. Used in the web address.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="d" className={labelCls}>Description</label>
        <input id="d" className={field} value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} placeholder="A short, cozy summary" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="a" className={labelCls}>Age band</label>
        <select id="a" className={field} value={ageBand} onChange={(e) => setAgeBand(e.target.value)} disabled={isPending}>
          {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {error && <p className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}
      <button type="submit" disabled={isPending} className="rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-60">
        {isPending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
```
- [ ] **Step 2: `app/admin/stories/new/page.tsx`:**
```tsx
import Link from "next/link";
import { NewStoryForm } from "@/components/admin/new-story-form";

export default function NewStoryPage() {
  return (
    <section className="space-y-5">
      <Link href="/admin" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to stories</Link>
      <h1 className="font-display text-2xl font-extrabold">New story</h1>
      <NewStoryForm />
    </section>
  );
}
```
- [ ] **Step 3:** `npm run build` clean. Controller verifies: create a draft, lands on the editor route (next task fills it in). Commit:
```bash
git add app/admin/stories/new components/admin/new-story-form.tsx
git commit -m "feat(admin): new-story form creates a draft and opens the editor"
```

### Task 8: Editor page shell + metadata panel

**Files:** create `app/admin/stories/[slug]/page.tsx`, `components/admin/story-metadata-panel.tsx`, `components/admin/publish-control.tsx`.

- [ ] **Step 1: `app/admin/stories/[slug]/page.tsx`** (server; loads everything, computes validity). Match the async `params` pattern from `app/(app)/story/[slug]/page.tsx`:
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminStory, listPages, listChoices } from "@/lib/admin/queries";
import { buildStoryInput } from "@/lib/admin/story-to-input";
import { validateStory } from "@/lib/stories/validate";
import { StoryMetadataPanel } from "@/components/admin/story-metadata-panel";
import { PublishControl } from "@/components/admin/publish-control";
import { PagesPanel } from "@/components/admin/pages-panel";

export default async function StoryEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const pages = await listPages(story.id);
  const choices = await listChoices(story.id);
  const errors = validateStory(buildStoryInput(story, pages, choices));
  const startKey = pages.find((p) => p.id === story.startPageId)?.key ?? null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin" className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to stories</Link>
        <PublishControl storyId={story.id} published={story.published} errors={errors} />
      </div>
      <h1 className="font-display text-2xl font-extrabold">{story.title}</h1>

      <StoryMetadataPanel
        story={{ id: story.id, title: story.title, description: story.description, ageBand: story.ageBand, coverImageUrl: story.coverImageUrl }}
        pageKeys={pages.map((p) => p.key)}
        startKey={startKey}
      />

      <PagesPanel
        storyId={story.id}
        pages={pages.map((p) => ({ id: p.id, key: p.key, body: p.body, isEnding: p.isEnding, endingLabel: p.endingLabel, endingType: p.endingType }))}
        choices={choices.map((c) => ({ id: c.id, pageId: c.pageId, toPageKey: c.toPageKey, label: c.label, order: c.order }))}
      />
    </section>
  );
}
```
- [ ] **Step 2: `components/admin/publish-control.tsx`** (client):
```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPublished } from "@/lib/admin-actions";

export function PublishControl({ storyId, published, errors }: { storyId: number; published: boolean; errors: string[] }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const blocked = !published && errors.length > 0;

  function toggle() {
    start(async () => { await setPublished(storyId, !published); router.refresh(); });
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending || blocked}
        className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-50"
        style={{ background: published ? "var(--pc-poppy-ink)" : "var(--pc-leaf-ink)" }}
      >
        {isPending ? "Saving…" : published ? "Unpublish" : "Publish"}
      </button>
      {blocked && <p className="text-xs font-semibold text-[var(--pc-poppy-ink)]">Fix the issues below to publish.</p>}
    </div>
  );
}
```
- [ ] **Step 3: `components/admin/story-metadata-panel.tsx`** (client; title/description/age/cover, start-page select, delete). Uses `updateStoryMeta`, `setStartPage`, `deleteStory`. Follow the `NewStoryForm` field styles; the start-page `<select>` lists `pageKeys` (label "start page"), calling `setStartPage` on change then `router.refresh()`; a Delete button (with `confirm()`) calls `deleteStory` then `router.push("/admin")`. Age select uses the same dash-free `AGE_OPTIONS`. Save button calls `updateStoryMeta` then `router.refresh()`. Show a validation-independent inline "Saved" or error state.
- [ ] **Step 4:** `npm run build` clean. Commit:
```bash
git add "app/admin/stories/[slug]/page.tsx" components/admin/story-metadata-panel.tsx components/admin/publish-control.tsx
git commit -m "feat(admin): story editor shell, metadata panel, publish control"
```

---

## Phase 3 — Page & scene editor

### Task 9: Page + choices server actions

**Files:** modify `lib/admin-actions.ts`.

- [ ] **Step 1:** Append to `lib/admin-actions.ts`:
```ts
import { isValidSlug as isValidKey } from "@/lib/admin/slugs";

export async function createPage(storyId: number, key: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  if (!isValidKey(key)) return { ok: false, error: "Key must be lowercase words joined by single hyphens" };
  const [dupe] = await db.select({ id: page.id }).from(page).where(and(eq(page.storyId, storyId), eq(page.key, key))).limit(1);
  if (dupe) return { ok: false, error: "That page key is already used in this story" };
  await db.insert(page).values({ storyId, key, body: "", isEnding: false });
  return { ok: true };
}

type PageEdit = { key: string; body: string; isEnding: boolean; endingType: string; endingLabel: string | null };

export async function updatePage(pageId: number, edit: PageEdit): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not allowed" };
  if (!isValidKey(edit.key)) return { ok: false, error: "Invalid page key" };
  if (edit.isEnding && !["good", "game_over"].includes(edit.endingType)) return { ok: false, error: "Invalid ending type" };
  const [self] = await db.select({ storyId: page.storyId }).from(page).where(eq(page.id, pageId)).limit(1);
  if (!self) return { ok: false };
  const [dupe] = await db.select({ id: page.id }).from(page)
    .where(and(eq(page.storyId, self.storyId), eq(page.key, edit.key))).limit(1);
  if (dupe && dupe.id !== pageId) return { ok: false, error: "That page key is already used in this story" };
  await db.update(page).set({
    key: edit.key, body: edit.body, isEnding: edit.isEnding,
    endingType: edit.isEnding ? edit.endingType : "good",
    endingLabel: edit.isEnding ? (edit.endingLabel?.trim() || null) : null,
  }).where(eq(page.id, pageId));
  if (edit.isEnding) await db.delete(choice).where(eq(choice.pageId, pageId)); // endings have no choices
  return { ok: true };
}

export async function deletePage(pageId: number): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  await db.delete(page).where(eq(page.id, pageId)); // choices cascade
  return { ok: true };
}

/** Replace a page's choices with the given ordered list. */
export async function setChoices(pageId: number, rows: { label: string; toPageKey: string }[]): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  await db.delete(choice).where(eq(choice.pageId, pageId));
  const clean = rows.map((r, i) => ({ pageId, label: r.label.trim(), toPageKey: r.toPageKey.trim(), order: i }))
    .filter((r) => r.label && r.toPageKey);
  if (clean.length) await db.insert(choice).values(clean);
  return { ok: true };
}
```
- [ ] **Step 2:** `npx tsc --noEmit` clean. Commit:
```bash
git add lib/admin-actions.ts
git commit -m "feat(admin): page + choices server actions"
```

### Task 10: Pages panel, page form, choices editor

**Files:** create `components/admin/pages-panel.tsx`, `components/admin/page-editor.tsx`, `components/admin/choices-editor.tsx`.

- [ ] **Step 1: `components/admin/choices-editor.tsx`** (client): rows of `label` text input + a target `<select>` of `pageKeys`; add-row, remove-row, and move-up/move-down buttons (all with the distinct clickable look, rule 2). A "Save choices" button calls `setChoices(pageId, rows)` then `router.refresh()`. Empty rows are dropped by the action.
- [ ] **Step 2: `components/admin/page-editor.tsx`** (client), one per page:
  - key input; a scene-body `<textarea>` plus an **"Insert {{name}}"** button that splices the literal `{{name}}` at the caret (track `selectionStart` via a ref);
  - an "This is an ending" toggle (`aria-pressed`). When ON: an ending-type control (two buttons "Good ending" / "Surprise ending" mapping to `good` / `game_over`, dash-free labels) + an ending-label text input; the choices editor is hidden. When OFF: the choices editor shows and ending fields hide.
  - a "Save page" button → `updatePage(pageId, {key, body, isEnding, endingType, endingLabel})` then `router.refresh()`; a Delete page button (`confirm()`) → `deletePage` then `router.refresh()`.
  - Reuse the `field`/`labelCls` styles from `new-story-form.tsx` (extract them to `components/admin/styles.ts` as exported consts `field`, `labelCls` and import in all admin client components to stay DRY).
- [ ] **Step 3: `components/admin/pages-panel.tsx`** (client): renders a "Pages" heading, an "Add page" control (a small inline key input + button calling `createPage(storyId, key)` then `router.refresh()`), and a list of `<PageEditor>` (passing that page's rows from `choices` filtered by `pageId`, plus all `pageKeys` for the choice/target selects). No dashes in any displayed label.
- [ ] **Step 4:** `npm run build` clean. Controller verifies end to end: add pages, write a scene with an inserted `{{name}}`, add choices between pages, mark an ending with a type + label, delete a page. Commit:
```bash
git add components/admin/pages-panel.tsx components/admin/page-editor.tsx components/admin/choices-editor.tsx components/admin/styles.ts
git commit -m "feat(admin): pages panel, scene editor (Insert name), choices editor"
```

### Task 10b: Draft preview (non-recording, reuses the reader)

**Files:** modify `components/story/story-reader.tsx`; create `app/admin/stories/[slug]/preview/page.tsx`; modify `app/admin/stories/[slug]/page.tsx` (add a Preview link).

- [ ] **Step 1:** `components/story/story-reader.tsx` — add a `preview?: boolean` prop (default `false`). When `preview` is true: do NOT run the `recordEnding` effect (guard it with `if (!preview && current.isEnding)`), keep `progress` as `null` (so the ending screen already hides the "X of Y" line + "See my endings"), and render a small high-contrast "Preview" chip in the sticky bar. Everything else (navigation, `personalize`, choice rendering) is unchanged, so a non-preview reader behaves exactly as before.
- [ ] **Step 2:** `app/admin/stories/[slug]/preview/page.tsx` (server; admin-gated by the `/admin` layout). Load the story with `getAdminStory(slug)` (works for drafts — no published filter), build the graph with `loadStoryGraph(story.id)`, resolve the start key from `story.startPageId` (fallback to the first page key), and render the reader in preview mode with a fixed sample name:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminStory } from "@/lib/admin/queries";
import { loadStoryGraph } from "@/lib/stories/graph";
import { StoryReader } from "@/components/story/story-reader";

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getAdminStory(slug);
  if (!story) notFound();
  const graph = await loadStoryGraph(story.id);
  const startKey =
    graph.pages[Object.keys(graph.pages).find((k) => graph.pages[k].id === story.startPageId) ?? ""]?.key
    ?? Object.keys(graph.pages)[0];
  if (!startKey) {
    return <p className="text-[var(--pc-sub)]">Add a page and set a start page to preview.</p>;
  }
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/admin/stories/${slug}`} className="text-sm font-bold text-[var(--pc-plum-ink)] underline">Back to the editor</Link>
        <span className="rounded-full bg-[var(--pc-sun)] px-3 py-1 text-xs font-extrabold text-[#3a2d00]">Preview</span>
      </div>
      <h1 className="mb-6 font-display text-2xl font-bold">{story.title}</h1>
      <StoryReader slug={slug} startKey={startKey} graph={graph} childName="Sam" initialFont="rounded" initialSize="md" preview />
    </div>
  );
}
```
(Note: `loadStoryGraph`'s `GraphPage` includes `id`, so the start-key lookup by `startPageId` works; if not, fall back to selecting the page key by id via a small query as in `app/(app)/story/[slug]/page.tsx`.)
- [ ] **Step 3:** In `app/admin/stories/[slug]/page.tsx`, add a **"Preview"** link next to the `PublishControl` in the top row, opening the preview in a new tab, with the distinct clickable look:
```tsx
<Link href={`/admin/stories/${slug}/preview`} target="_blank"
  className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px">
  Preview
</Link>
```
- [ ] **Step 4:** `npm run build` + `npx tsc --noEmit` clean; `npm run test` green (no test change; the public reader path is unaffected). Controller verifies later: Preview opens a draft, renders with the name "Sam", and reaching an ending shows the ending screen with no progress line and records nothing. Commit:
```bash
git add components/story/story-reader.tsx "app/admin/stories/[slug]/preview/page.tsx" "app/admin/stories/[slug]/page.tsx"
git commit -m "feat(admin): non-recording draft preview reusing the reader"
```

---

## Phase 4 — Validation surfacing

### Task 11: Show validity + gate publish in the editor

**Files:** create `components/admin/validation-summary.tsx`; modify `app/admin/stories/[slug]/page.tsx`.

- [ ] **Step 1: `components/admin/validation-summary.tsx`** (server-friendly, presentational): given `errors: string[]`, render nothing when empty, else a Paper Cut warning card listing each error as a bullet, headline "Fix these before publishing" (no dashes, high-contrast text). Map raw error strings to friendlier copy where trivial (e.g. leave as-is if already clear; do NOT invent new error types).
- [ ] **Step 2:** In `app/admin/stories/[slug]/page.tsx`, render `<ValidationSummary errors={errors} />` directly under the `<h1>` (above the metadata panel). `errors` and the `blocked` state already flow into `PublishControl` (Task 8) — confirm publish is disabled while `errors.length > 0` and enabled once empty (the page is a server component, so `router.refresh()` after any save recomputes `errors`).
- [ ] **Step 3:** `npm run build` clean. Controller verifies: a story with a dangling choice or no start page shows the summary and a disabled Publish; fixing the issues (then the auto-refresh) clears the summary and enables Publish; publishing makes it appear in the public catalog; Unpublish hides it. Commit:
```bash
git add components/admin/validation-summary.tsx "app/admin/stories/[slug]/page.tsx"
git commit -m "feat(admin): surface validation + gate publish on validity"
```

---

## Phase 5 — Compliance pass + end-to-end

### Task 12: UI rules sweep over the admin surface

**Files:** various (targeted, `app/admin/**` + `components/admin/**`).

- [ ] **Step 1 (rule 1, dashes):** Grep `app/admin` + `components/admin` for hyphen/em-dash punctuation in DISPLAYED strings (JSX text, labels, placeholders, button text). Age bands must read "Ages 2 to 4" etc. Do NOT change slugs, page keys, enum values, or `{{name}}`.
```bash
grep -rnE "[A-Za-z] - [A-Za-z]|—|–" app/admin components/admin
```
- [ ] **Step 2 (rule 2, clickable):** Confirm every button/link/tappable row in admin carries the distinct look (`shadow-[0_4px_0_...]` + `active:translate-y-px`, or the underlined link style) and a visible `focus-visible` ring. No decorative element mimics a button.
- [ ] **Step 3 (rule 3, contrast):** Grep admin for low-opacity text utilities and replace with `--pc-ink`/`--pc-sub`:
```bash
grep -rnE "text-(white|black)/|/40|/50|opacity-" app/admin components/admin
```
- [ ] **Step 4:** `npm run test` + `npm run build` green. Controller does the full signed-in admin walkthrough (create → add pages/choices → insert {{name}} → set endings → fix validation → publish → shows in catalog and reads correctly for a child → unpublish hides it; a non-admin still 404s at `/admin`). Commit any fixes:
```bash
git commit -am "chore(admin): enforce no-dashes, clickable affordances, high-contrast copy"
```

---

## Self-Review Notes

- **Spec coverage:** admin gate + `isAdmin` (T2,3) · `story.published` + public/reader/collection filters (T1) · story CRUD + metadata + start-page + publish (T6,7,8) · page/scene editor with Insert {{name}} + ending toggle/type/label (T9,10) · choices editor (T9,10) · validation reuse + publish gating (T5,6,11) · coexistence with `db:seed` (T1 sets `published:true`) · UI rules incl. compliance pass (T12, enforced throughout). Deferred items (wizard, graph canvas, versions, image upload, rich text, roles) are intentionally out.
- **TDD:** pure/testable units are test-first — `isAdmin` (T2), slug/key validators (T4), `buildStoryInput` transform reusing `validateStory` (T5). DB round-trips and UI are verified by running/build + the controller walkthrough (server actions have no pure return worth unit-testing beyond the transform).
- **Type consistency:** `AdminStory`/`AdminPage`/`AdminChoice` (from `lib/admin/queries.ts`) are the row types consumed by `buildStoryInput` (T5) and the editor (T8). `StoryMeta`/`PageEdit` action inputs match the form fields. `buildStoryInput` output is exactly `StoryInput` from `_story-types.ts`, so `validateStory` applies unchanged.
- **No new tables:** only `story.published`. Migration is a pure additive column with a default (existing rows → `false`; seed sets `true`).
- **Reused unchanged:** reader, `personalize()`, gameplay, `StoryCover`, `validateStory`, `_story-types.ts`. Only the `published` filter is added to public queries.
- **UI rules:** dash-free displayed copy (age labels mapped to words; keys/slugs untouched); Paper Cut clickable affordances on every control; high-contrast tokens only.
- **Next 16:** `params` is awaited in the `[slug]` route; `/admin` self-gates in its layout (getParent + isAdmin → notFound), independent of middleware.
```
