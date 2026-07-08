# Accounts, Child Profiles & Personalization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-credential auth with real parent accounts (email/password + Google + Apple), add child profiles (name + reading mode), an active-child selector, a global story catalog with age-band labels, and `{{name}}` personalization filled from the active child.

**Architecture:** BetterAuth (reintroduced) over Neon/Drizzle for the parent account. A `child` table nested under the parent. The active child is a signed cookie, validated server-side. Story text interpolates a `{{name}}` token from the active child. The Paper Cut UI and story engine carry over.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/Base UI, BetterAuth 1.6, Drizzle 0.45, Neon, Vitest.

**Prerequisite:** Current app on `master` (single-credential auth, Paper Cut UI). `better-auth` is still in `package.json`. `.env.local` holds `DATABASE_URL`; a `BETTER_AUTH_SECRET` must be present (add one). Social creds are provisioned later (Phase 5).

**Verification note:** subagents verify build/tsc/lint and run DB/logic checks; the controller does the signed-in browser walkthrough (subagents lack credentials and must never read `.env.local`).

---

## Phase 1 — Schema recreate

### Task 1: Rewrite `db/schema.ts` (parent + child + catalog)

**Files:** modify `db/schema.ts`.

- [ ] **Step 1: Replace `db/schema.ts` with:**
```ts
import {
  pgTable, serial, text, integer, boolean, timestamp, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";

// --- BetterAuth core tables. `user` is the PARENT account. ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Child profiles (nested under a parent; no login). ---
export const child = pgTable("child", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  readingMode: text("reading_mode").notNull().default("read_to_me"), // read_to_me | can_read
  readerFont: text("reader_font").notNull().default("rounded"),
  readerFontSize: text("reader_font_size").notNull().default("md"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Story catalog (global; no per-user access). ---
export const story = pgTable("story", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ageBand: text("age_band"), // "2-4" | "5-7" | "8+" | null
  startPageId: integer("start_page_id"),
  coverImageUrl: text("cover_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const page = pgTable(
  "page",
  {
    id: serial("id").primaryKey(),
    storyId: integer("story_id").notNull().references(() => story.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    isEnding: boolean("is_ending").notNull().default(false),
    endingLabel: text("ending_label"),
  },
  (t) => ({ storyKeyUnq: uniqueIndex("page_story_key_unq").on(t.storyId, t.key) }),
);

export const choice = pgTable("choice", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
  toPageKey: text("to_page_key").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

// --- Per-child ending progress. ---
export const endingFound = pgTable(
  "ending_found",
  {
    childId: integer("child_id").notNull().references(() => child.id, { onDelete: "cascade" }),
    storyId: integer("story_id").notNull().references(() => story.id, { onDelete: "cascade" }),
    pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
    foundAt: timestamp("found_at").notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.childId, t.pageId] }) }),
);
```

- [ ] **Step 2: Recreate the schema in Neon.** The existing test data is disposable. Generate and push, accepting drops:
```
npm run db:generate
npm run db:push
```
If `db:push` warns about dropping `story_access` / columns / re-keying `ending_found` (data loss), accept it (`npx drizzle-kit push --force` if needed). Verify tables afterward with a neon query (read URL from env at runtime): expect `user, session, account, verification, child, story, page, choice, ending_found` and NO `story_access`.

- [ ] **Step 3:** `npx tsc --noEmit` — note it will fail on `db/schema.ts` consumers (old `getReader`, seed, etc.) until later tasks; the schema file itself must be error-free. Commit:
```
git add db/schema.ts drizzle
git commit -m "feat(data): parent+child schema, global catalog, per-child progress"
```

---

## Phase 2 — Auth (BetterAuth)

### Task 2: BetterAuth server, route handler, client

**Files:** replace `lib/auth.ts`; delete `lib/auth-actions.ts`; create `app/api/auth/[...all]/route.ts`, `lib/auth-client.ts`. Ensure `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` in `.env.local` and `.env.example`.

- [ ] **Step 1: Replace `lib/auth.ts`** (the current single-credential module) with the BetterAuth server. Social providers are included ONLY when their env creds exist, so dev works with email/password alone:
```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

type Social = NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]>;
const socialProviders: Social = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: true },
  socialProviders,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
```

- [ ] **Step 2: Create `app/api/auth/[...all]/route.ts`:**
```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 3: Create `lib/auth-client.ts`:**
```ts
"use client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
export const { signIn, signUp, signOut, useSession } = authClient;
```

- [ ] **Step 4: Delete the old single-credential action file:** `git rm lib/auth-actions.ts`. Add `NEXT_PUBLIC_APP_URL="http://localhost:3000"` to `.env.local` and `.env.example`. Ensure `BETTER_AUTH_SECRET` (generate `openssl rand -base64 32`) and `BETTER_AUTH_URL="http://localhost:3000"` exist in both (example uses placeholders). Remove the now-unused `AUTH_USERNAME`/`AUTH_PASSWORD`/`SESSION_SECRET` from `.env.example` (leave `.env.local` alone re: secrets — only the controller edits it).

- [ ] **Step 5:** `npm run build` will still fail on old `getReader` consumers — that's fixed in Task 3. Confirm `lib/auth.ts` type-checks in isolation (`npx tsc --noEmit` may still show downstream errors). Commit:
```
git add lib/auth.ts app/api/auth lib/auth-client.ts .env.example
git commit -m "feat(auth): BetterAuth parent auth (email/password + optional social)"
```

### Task 3: Parent session helper + middleware

**Files:** replace `lib/session.ts`; modify `middleware.ts`.

- [ ] **Step 1: Replace `lib/session.ts`** (drop the old cookie `getReader`) with:
```ts
// lib/session.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type Parent = { id: string; name: string; email: string };

/** The signed-in parent, or null. Safe in Server Components. */
export async function getParent(): Promise<Parent | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s?.user) return null;
  return { id: s.user.id, name: s.user.name, email: s.user.email };
}
```

- [ ] **Step 2: Update `middleware.ts`** to gate on the BetterAuth session cookie (Edge-safe; presence only). Public paths: `/sign-in`, `/sign-up`, `/api/auth`.
```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```
- [ ] **Step 3:** `npx tsc --noEmit` — remaining errors now come only from screens still importing `getReader`/`signInAction` (fixed in Task 4 and Phase 4). Commit:
```
git add lib/session.ts middleware.ts
git commit -m "feat(auth): parent session helper + middleware"
```

### Task 4: Sign-in + sign-up screens (Paper Cut)

**Files:** rewrite `app/sign-in/page.tsx`; create `app/sign-up/page.tsx`; create `components/auth/social-buttons.tsx`.

- [ ] **Step 1: `components/auth/social-buttons.tsx`** — Google + Apple buttons that call `signIn.social`. They render always; if a provider isn't configured the callback simply errors and we show a message (acceptable pre-provisioning).
```tsx
// components/auth/social-buttons.tsx
"use client";
import { signIn } from "@/lib/auth-client";

export function SocialButtons() {
  const go = (provider: "google" | "apple") =>
    signIn.social({ provider, callbackURL: "/" });
  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={() => go("google")} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Continue with Google</button>
      <button onClick={() => go("apple")} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--pc-line)] bg-white py-2.5 font-display font-bold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Continue with Apple</button>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `app/sign-in/page.tsx`** — email/password via `signIn.email`, plus `<SocialButtons/>`, plus a link to `/sign-up`. Keep the Paper Cut card styling from the current sign-in (white rounded-3xl card on sky, brand chip, plum button, `text-[var(--pc-poppy-ink)]` errors). Fields: email, password. On success `router.push("/"); router.refresh();`. On error show `error.message`.

- [ ] **Step 3: Create `app/sign-up/page.tsx`** — same styling; fields: **name** (parent's name), **email**, **password**; calls `signUp.email({ name, email, password })`; `<SocialButtons/>`; link back to `/sign-in`. On success `router.push("/")`.

- [ ] **Step 4: Verify** `npm run build` passes (all `getReader` consumers are still to be updated in Phase 4 — if any block the build, temporarily they still compile because we haven't removed `getReader` usage yet; if the build fails, note which files and proceed to Phase 3/4 which fix them). Commit:
```
git add app/sign-in/page.tsx app/sign-up/page.tsx components/auth/social-buttons.tsx
git commit -m "feat(auth): Paper Cut sign-in + sign-up with social buttons"
```

---

## Phase 3 — Child profiles + active child

### Task 5: Child queries + actions

**Files:** create `lib/children.ts` (queries) and `lib/children-actions.ts` (`"use server"`).

- [ ] **Step 1: `lib/children.ts`:**
```ts
// lib/children.ts
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db/client";
import { child } from "@/db/schema";

export type Child = {
  id: number; name: string; readingMode: string;
  readerFont: string; readerFontSize: string;
};

export async function listChildren(parentId: string): Promise<Child[]> {
  return db
    .select({ id: child.id, name: child.name, readingMode: child.readingMode, readerFont: child.readerFont, readerFontSize: child.readerFontSize })
    .from(child)
    .where(eq(child.parentId, parentId))
    .orderBy(asc(child.createdAt));
}

export async function getChildForParent(parentId: string, childId: number): Promise<Child | null> {
  const [row] = await db
    .select({ id: child.id, name: child.name, readingMode: child.readingMode, readerFont: child.readerFont, readerFontSize: child.readerFontSize })
    .from(child)
    .where(and(eq(child.id, childId), eq(child.parentId, parentId)))
    .limit(1);
  return row ?? null;
}
```

- [ ] **Step 2: `lib/children-actions.ts`:**
```ts
// lib/children-actions.ts
"use server";
import { and, eq } from "drizzle-orm";
import { getParent } from "@/lib/session";
import { db } from "@/db/client";
import { child } from "@/db/schema";

const MODES = ["read_to_me", "can_read"];

export async function createChild(name: string, readingMode: string): Promise<{ ok: boolean; id?: number }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  const clean = name.trim();
  if (!clean || clean.length > 40 || !MODES.includes(readingMode)) return { ok: false };
  const [row] = await db.insert(child).values({ parentId: parent.id, name: clean, readingMode }).returning({ id: child.id });
  return { ok: true, id: row.id };
}

export async function updateChild(childId: number, name: string, readingMode: string): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  const clean = name.trim();
  if (!clean || clean.length > 40 || !MODES.includes(readingMode)) return { ok: false };
  await db.update(child).set({ name: clean, readingMode }).where(and(eq(child.id, childId), eq(child.parentId, parent.id)));
  return { ok: true };
}

export async function removeChild(childId: number): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  await db.delete(child).where(and(eq(child.id, childId), eq(child.parentId, parent.id)));
  return { ok: true };
}
```
- [ ] **Step 3:** `npx tsc --noEmit` clean for these files. Commit:
```
git add lib/children.ts lib/children-actions.ts
git commit -m "feat(profiles): child queries + CRUD actions (ownership-checked)"
```

### Task 6: Active-child cookie

**Files:** create `lib/active-child.ts` (helper + `getActiveChild`) and `lib/active-child-actions.ts` (`"use server"` set/clear).

- [ ] **Step 1: `lib/active-child.ts`** — signs the child id with `BETTER_AUTH_SECRET` (HMAC) and validates ownership on read:
```ts
// lib/active-child.ts
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getParent } from "@/lib/session";
import { getChildForParent, type Child } from "@/lib/children";

export const ACTIVE_CHILD_COOKIE = "active_child";

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET is not set");
  return s;
}
export function signChildId(id: number): string {
  const payload = String(id);
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function readChildId(token: string | undefined): number | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const n = Number(payload);
  return Number.isInteger(n) ? n : null;
}

/** The active child (validated against the signed-in parent), or null. */
export async function getActiveChild(): Promise<Child | null> {
  const parent = await getParent();
  if (!parent) return null;
  const jar = await cookies();
  const id = readChildId(jar.get(ACTIVE_CHILD_COOKIE)?.value);
  if (id == null) return null;
  return getChildForParent(parent.id, id);
}
```

- [ ] **Step 2: `lib/active-child-actions.ts`:**
```ts
// lib/active-child-actions.ts
"use server";
import { cookies } from "next/headers";
import { getParent } from "@/lib/session";
import { getChildForParent } from "@/lib/children";
import { ACTIVE_CHILD_COOKIE, signChildId } from "@/lib/active-child";

export async function setActiveChild(childId: number): Promise<{ ok: boolean }> {
  const parent = await getParent();
  if (!parent) return { ok: false };
  const c = await getChildForParent(parent.id, childId);
  if (!c) return { ok: false };
  const jar = await cookies();
  jar.set(ACTIVE_CHILD_COOKIE, signChildId(childId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 90,
  });
  return { ok: true };
}

export async function clearActiveChild(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACTIVE_CHILD_COOKIE);
}
```
- [ ] **Step 3:** `npx tsc --noEmit` clean. Commit:
```
git add lib/active-child.ts lib/active-child-actions.ts
git commit -m "feat(profiles): signed active-child cookie + resolver"
```

### Task 7: Onboarding + "Who's reading?" picker + home resolution

**Files:** create `components/profiles/child-picker.tsx`, `components/profiles/child-form.tsx`; modify `app/(app)/layout.tsx` (header switch) and add `app/(app)/page.tsx` logic to route between picker/library.

- [ ] **Step 1:** Build `ChildForm` (client) — name input + reading-mode radio (Read to me / I can read) calling `createChild`; used in onboarding and `/family`.
- [ ] **Step 2:** Build `ChildPicker` (client) — a grid of child "avatars" (Paper Cut chips with the initial + name) that call `setActiveChild(id)` then `router.push("/")`, plus an "Add a child" tile opening `ChildForm`.
- [ ] **Step 3:** Rewrite `app/(app)/page.tsx` home resolution:
```tsx
// app/(app)/page.tsx
import { getParent } from "@/lib/session";
import { listChildren } from "@/lib/children";
import { getActiveChild } from "@/lib/active-child";
import { ChildPicker } from "@/components/profiles/child-picker";
import { Library } from "@/components/library"; // built in Task 11

export default async function Home() {
  const parent = (await getParent())!;
  const kids = await listChildren(parent.id);
  const active = await getActiveChild();

  if (kids.length === 0 || !active) {
    return <ChildPicker children={kids} needsFirst={kids.length === 0} />;
  }
  return <Library activeChild={active} />;
}
```
- [ ] **Step 4:** Update `app/(app)/layout.tsx` header: show the active child's name + a "Switch" affordance (links to a `/switch` route or reopens the picker by clearing the cookie then routing home) and the account menu (Sign out via `signOut()` from auth-client; Family link). Keep Paper Cut styling.
- [ ] **Step 5:** Verify build. Commit:
```
git add "app/(app)" components/profiles
git commit -m "feat(profiles): onboarding, child picker, header switch"
```

### Task 8: `/family` management page

**Files:** create `app/(app)/family/page.tsx`.

- [ ] **Step 1:** Server component lists the parent's children (edit name/mode via `ChildForm` + `updateChild`, delete via `removeChild` with a confirm), plus an "Add a child" action. Paper Cut styled, responsive. Commit:
```
git add "app/(app)/family"
git commit -m "feat(profiles): family management page"
```

---

## Phase 4 — Personalization + catalog

### Task 9: `personalize()` (TDD)

**Files:** create `lib/stories/personalize.ts` + `lib/stories/personalize.test.ts`.

- [ ] **Step 1: Failing test `lib/stories/personalize.test.ts`:**
```ts
import { describe, it, expect } from "vitest";
import { personalize } from "./personalize";

describe("personalize", () => {
  it("replaces a single token", () => {
    expect(personalize("Hi {{name}}!", "Milo")).toBe("Hi Milo!");
  });
  it("replaces repeated tokens", () => {
    expect(personalize("{{name}} and {{name}}", "Ava")).toBe("Ava and Ava");
  });
  it("leaves text without a token unchanged", () => {
    expect(personalize("Once upon a time", "Milo")).toBe("Once upon a time");
  });
  it("is exact-match only (ignores spaced variants)", () => {
    expect(personalize("{{ name }}", "Milo")).toBe("{{ name }}");
  });
});
```
- [ ] **Step 2: Run → FAIL.** `npx vitest run lib/stories/personalize.test.ts`
- [ ] **Step 3: Implement `lib/stories/personalize.ts`:**
```ts
// lib/stories/personalize.ts
/** Replace the {{name}} token with the child's name. Exact-match only. */
export function personalize(text: string, name: string): string {
  return text.split("{{name}}").join(name);
}
```
- [ ] **Step 4: Run → PASS** (4 tests); full suite still green. Commit:
```
git add lib/stories/personalize.ts lib/stories/personalize.test.ts
git commit -m "feat(stories): {{name}} personalization with tests"
```

### Task 10: Reader uses active child (name + a11y + per-child progress)

**Files:** modify `lib/stories/queries.ts`, `lib/stories/actions.ts`, `lib/stories/graph.ts` (countEndingsFound), `components/story/story-reader.tsx`, `app/(app)/story/[slug]/page.tsx`.

- [ ] **Step 1:** In `lib/stories/queries.ts`, replace the access-gated queries with catalog queries: `getStoryBySlug(slug)` (no access join) returning `{id, slug, title, startPageId}`; and update `getLibraryForReader` → `getCatalog(ageBand?)` returning cards incl. `ageBand` (built out in Task 11).
- [ ] **Step 2:** `lib/stories/actions.ts` `recordEnding(slug, pageKey)` now resolves the **active child** (via `getActiveChild()`), verifies the page is an ending, inserts `endingFound(childId, storyId, pageId)`, and returns `{found,total}` counted per child. `lib/stories/graph.ts` `countEndingsFound(childId, storyId)` re-keyed to `childId`.
- [ ] **Step 3:** `app/(app)/story/[slug]/page.tsx`: resolve `getActiveChild()`; if none → `redirect("/")`. Load story via `getStoryBySlug`. Pass `childName={active.name}`, `initialFont={active.readerFont}`, `initialSize={active.readerFontSize}` to `StoryReader`.
- [ ] **Step 4:** `components/story/story-reader.tsx`: accept `childName: string`; render the prose as `personalize(current.body, childName)`; also personalize choice labels (`personalize(c.label, childName)`). Persist a11y prefs to the **active child** (new `setChildReadingPrefs` action — add to `lib/children-actions.ts`, ownership-checked, updates `child.readerFont/readerFontSize`). Everything else (navigation, endings, Aa panel) unchanged.
- [ ] **Step 5:** Verify build/tsc. Commit:
```
git add lib/stories components/story/story-reader.tsx "app/(app)/story"
git commit -m "feat(stories): reader personalizes text + per-child progress"
```

### Task 11: Global catalog library + age-band filter

**Files:** create `components/library.tsx`; finalize `getCatalog` in `lib/stories/queries.ts`.

- [ ] **Step 1:** `getCatalog(ageBand?: string)` returns all stories (optionally filtered by `ageBand`) with `{id, slug, title, description, ageBand}` ordered by title.
- [ ] **Step 2:** `components/library.tsx` (server component, receives `activeChild`) — greeting "What shall we read, {name}?", an age-band filter (All / 2–4 / 5–7 / 8+ — links with a `?age=` query the server reads), the Paper Cut responsive card grid with `StoryCover` + an **age-band label chip** per card. Reuse the current library card styling.
- [ ] **Step 3:** Verify. Commit:
```
git add components/library.tsx lib/stories/queries.ts
git commit -m "feat(library): global catalog with age-band label + filter"
```

### Task 12: Seed update (age bands, {{name}}, no access)

**Files:** modify `content/stories/_story-types.ts`, `scripts/seed-stories.ts`, `content/stories/bean-whispering-woods.ts`; update `lib/stories/validate.ts`.

- [ ] **Step 1:** `_story-types.ts`: add optional `ageBand?: "2-4" | "5-7" | "8+"` to `StoryInput`; drop `readers` (no per-user access). `validate.ts`: remove the readers check; add an optional check that `ageBand`, when present, is one of the allowed bands.
- [ ] **Step 2:** `seed-stories.ts`: remove the reader-mapping + `storyAccess` logic; upsert `story.ageBand`; everything else (pages/choices/startPage) unchanged.
- [ ] **Step 3:** `bean-whispering-woods.ts`: add `ageBand: "2-4"`, remove `readers`, and weave in `{{name}}` (e.g., start page: "{{name}} and Bean the little bear stood at the edge of the whispering woods.") authored pronoun-free.
- [ ] **Step 4:** `npm run db:seed`; verify one story with `age_band='2-4'` and pages containing `{{name}}`. Full test suite green. Commit:
```
git add content/stories scripts/seed-stories.ts lib/stories/validate.ts
git commit -m "feat(content): age bands + {{name}} in stories; drop per-user access"
```

---

## Phase 5 — Social providers + polish + verification

### Task 13: Verify + polish

- [ ] **Step 1:** `npm run test` + `npm run build` green.
- [ ] **Step 2 (controller, signed-in):** create a parent (sign-up), add two children, verify the picker + switch, verify `{{name}}` appears with each child's name, verify per-child endings are independent, verify age-band filter, verify a11y prefs persist per child, verify `/family` CRUD.
- [ ] **Step 3 (social, when creds exist):** add `GOOGLE_CLIENT_ID/SECRET` and Apple creds to `.env.local`; set redirect URIs; confirm Google + Apple sign-in. Note: Apple's `clientSecret` is a generated JWT (from the Apple key) — follow BetterAuth's Apple provider docs. If creds aren't ready, this step is deferred without blocking the rest.
- [ ] **Step 4:** a11y/responsive pass (focus rings, tap targets, mobile picker/library/reader; contrast on any new colored surfaces). Fix + commit per issue.

---

## Self-Review Notes

- Spec coverage: auth email/password+social (Tasks 2–4), parent→child model (Task 1, 5), active child (6, 7), family mgmt (8), personalization (9, 10), global catalog + age band (11, 12), per-child progress (10), reused engine/UI throughout.
- `"use server"` split respected (children-actions, active-child-actions separate from constant/query modules).
- Ownership enforced server-side: every child action and `getActiveChild` re-checks the child belongs to the signed-in parent; a cross-parent child id is rejected.
- No ads/analytics/payment SDKs introduced (later sub-projects). Child data limited to name + reading mode + a11y prefs.
- Base UI Button has no `asChild`; use classed `<button>`/`<Link>`.
- Social providers are conditional so dev/build works before Google/Apple creds exist.
- Clean DB recreate (test data disposable) — no migration of the old `milo` rows.
