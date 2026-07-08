# Foundation & Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js app and stand up the Neon/Drizzle data layer with the full schema, the typed story-authoring format, a validated seed pipeline, and one sample story.

**Architecture:** A single Next.js (App Router) + TypeScript app. Postgres (Neon) accessed through Drizzle ORM. Stories are authored as typed `.ts` files under `content/stories/`, validated and upserted into the DB by a seed script. Unit logic (story validation, seeding) is developed test-first with Vitest.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, `@neondatabase/serverless`, BetterAuth (tables only in this plan), Vitest.

---

## File Structure (created by this plan)

- `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind`, `components.json` — scaffolded app config.
- `.env.local` — `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- `drizzle.config.ts` — Drizzle Kit config.
- `db/client.ts` — Neon + Drizzle client singleton.
- `db/schema.ts` — all tables (auth + domain).
- `content/stories/_story-types.ts` — `defineStory()` helper + story input types.
- `content/stories/bean-whispering-woods.ts` — sample story.
- `lib/stories/validate.ts` — pure validation of a story input object.
- `lib/stories/validate.test.ts` — Vitest unit tests for validation.
- `scripts/seed-stories.ts` — loads story files, validates, upserts to Neon.
- `vitest.config.ts` — test runner config.

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: project scaffold in `C:\Code\personal\project-bean` (app/, package.json, tsconfig.json, etc.)

Scaffolding is verified by building and running, not by a unit test.

- [ ] **Step 1: Create the Next.js app in the current directory**

Run from `C:\Code\personal\project-bean` (the folder already contains `.git`, `.gitignore`, and `docs/`, so scaffold into the current directory):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```

When prompted that the directory is not empty, choose to proceed (it only contains `.git`, `.gitignore`, `docs/`). If create-next-app refuses due to non-empty dir, scaffold in a temp dir and copy files in, preserving the existing `.git`, `.gitignore`, and `docs/`.

- [ ] **Step 2: Verify the app builds and runs**

Run:
```bash
npm run build
```
Expected: build completes with no errors.

Run:
```bash
npm run dev
```
Expected: dev server starts on http://localhost:3000 and the default Next.js page loads. Stop the server after confirming.

- [ ] **Step 3: Merge .gitignore**

create-next-app overwrites `.gitignore`. Ensure these lines are present (re-add if create-next-app dropped them):
```
.env
.env*.local
.superpowers/
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

## Task 2: Initialize shadcn/ui

**Files:**
- Create: `components.json`, `components/ui/*`, `lib/utils.ts`

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init -d
```
Accept defaults (New York style, Neutral base color). This creates `components.json` and `lib/utils.ts`.

- [ ] **Step 2: Add the base components we will need**

```bash
npx shadcn@latest add button card input label
```
Expected: files appear under `components/ui/`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize shadcn/ui with base components"
```

---

## Task 3: Install data + test dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless better-auth
npm install -D drizzle-kit vitest dotenv tsx @types/node
```

- [ ] **Step 2: Add scripts to package.json**

In `package.json` `"scripts"`, add:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:seed": "tsx scripts/seed-stories.ts",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle, neon, better-auth, vitest deps"
```

---

## Task 4: Configure environment and Vitest

**Files:**
- Create: `.env.local`, `.env.example`, `vitest.config.ts`

- [ ] **Step 1: Create `.env.example` (committed) documenting required vars**

```bash
# .env.example
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
BETTER_AUTH_SECRET="generate-with: openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:3000"
```

- [ ] **Step 2: Create `.env.local` (gitignored) with real Neon values**

Fill `DATABASE_URL` from the Neon dashboard connection string. Generate the secret:
```bash
openssl rand -base64 32
```
Put the output in `BETTER_AUTH_SECRET`. Set `BETTER_AUTH_URL="http://localhost:3000"`.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"],
  },
  resolve: {
    // Resolve the "@/*" path alias (matches tsconfig) so tests can import app modules.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
```

- [ ] **Step 4: Verify Vitest runs (no tests yet is OK)**

Run: `npx vitest run`
Expected: "No test files found" or passes with 0 tests. No crash.

- [ ] **Step 5: Commit**

```bash
git add .env.example vitest.config.ts
git commit -m "chore: add env template and vitest config"
```

---

## Task 5: Drizzle client and config

**Files:**
- Create: `db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create `db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

- [ ] **Step 2: Create `drizzle.config.ts`**

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add db/client.ts drizzle.config.ts
git commit -m "feat: add drizzle client and kit config"
```

---

## Task 6: Database schema

**Files:**
- Create: `db/schema.ts`

- [ ] **Step 1: Write `db/schema.ts` with auth + domain tables**

```ts
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// --- BetterAuth core tables (schema per BetterAuth Drizzle adapter) ---
// The `user` table is our "reader". Extra columns (username, displayName, theme)
// are added below and configured in BetterAuth via additionalFields.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Reader-specific fields:
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  theme: text("theme").notNull().default("cozy"),
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

// --- Domain tables ---
export const story = pgTable("story", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
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
  (t) => ({
    storyKeyUnq: uniqueIndex("page_story_key_unq").on(t.storyId, t.key),
  }),
);

export const choice = pgTable("choice", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
  toPageKey: text("to_page_key").notNull(),
  label: text("label").notNull(),
  order: integer("order").notNull().default(0),
});

export const storyAccess = pgTable(
  "story_access",
  {
    storyId: integer("story_id").notNull().references(() => story.id, { onDelete: "cascade" }),
    readerId: text("reader_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storyId, t.readerId] }),
  }),
);

export const endingFound = pgTable(
  "ending_found",
  {
    readerId: text("reader_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    storyId: integer("story_id").notNull().references(() => story.id, { onDelete: "cascade" }),
    pageId: integer("page_id").notNull().references(() => page.id, { onDelete: "cascade" }),
    foundAt: timestamp("found_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.readerId, t.pageId] }),
  }),
);
```

- [ ] **Step 2: Generate and push the schema to Neon**

```bash
npm run db:generate
npm run db:push
```
Expected: migration SQL generated under `drizzle/`; push reports tables created. Verify in the Neon dashboard that `user`, `session`, `account`, `verification`, `story`, `page`, `choice`, `story_access`, `ending_found` exist.

- [ ] **Step 3: Commit**

```bash
git add db/schema.ts drizzle
git commit -m "feat: add database schema (auth + story domain)"
```

---

## Task 7: Story-authoring types and `defineStory()`

**Files:**
- Create: `content/stories/_story-types.ts`

- [ ] **Step 1: Write the story input types and helper**

```ts
// content/stories/_story-types.ts

export type ChoiceInput = {
  label: string;
  to: string; // target page key
};

export type PageInput = {
  body: string;
  choices?: ChoiceInput[];
  ending?: string;   // presence marks this page as an ending; value is the ending label
  imageUrl?: string; // nullable; unused in v1 UI
};

export type StoryInput = {
  slug: string;
  title: string;
  description?: string;
  readers: string[]; // reader usernames who may see this story
  start: string;     // page key to start on
  coverImageUrl?: string;
  pages: Record<string, PageInput>; // keyed by page key
};

/** Identity helper that gives full type-checking + autocomplete when authoring stories. */
export function defineStory(story: StoryInput): StoryInput {
  return story;
}
```

- [ ] **Step 2: Commit**

```bash
git add content/stories/_story-types.ts
git commit -m "feat: add story authoring types and defineStory helper"
```

---

## Task 8: Story validation (TDD)

**Files:**
- Create: `lib/stories/validate.ts`
- Test: `lib/stories/validate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/stories/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateStory } from "./validate";
import type { StoryInput } from "@/content/stories/_story-types";

const base: StoryInput = {
  slug: "s",
  title: "S",
  readers: ["milo"],
  start: "a",
  pages: {
    a: { body: "start", choices: [{ label: "go", to: "b" }] },
    b: { body: "the end", ending: "The End" },
  },
};

describe("validateStory", () => {
  it("returns no errors for a valid story", () => {
    expect(validateStory(base)).toEqual([]);
  });

  it("flags a start key that does not exist", () => {
    const errors = validateStory({ ...base, start: "missing" });
    expect(errors).toContain('start page "missing" does not exist');
  });

  it("flags a choice pointing to a missing page", () => {
    const s: StoryInput = {
      ...base,
      pages: { a: { body: "x", choices: [{ label: "go", to: "nope" }] } },
    };
    expect(validateStory(s)).toContain('page "a" choice -> "nope" targets a missing page');
  });

  it("flags a non-ending page with no choices", () => {
    const s: StoryInput = { ...base, pages: { a: { body: "x" }, b: { body: "y", ending: "E" } }, start: "a" };
    expect(validateStory(s)).toContain('page "a" is not an ending but has no choices');
  });

  it("flags an ending page that also has choices", () => {
    const s: StoryInput = {
      ...base,
      pages: {
        a: { body: "x", choices: [{ label: "go", to: "b" }] },
        b: { body: "y", ending: "E", choices: [{ label: "again", to: "a" }] },
      },
    };
    expect(validateStory(s)).toContain('page "b" is an ending but has choices');
  });

  it("flags an empty readers list", () => {
    expect(validateStory({ ...base, readers: [] })).toContain("readers list is empty");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/stories/validate.test.ts`
Expected: FAIL — `validateStory` is not defined / module not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/stories/validate.ts
import type { StoryInput } from "@/content/stories/_story-types";

/** Returns an array of human-readable error strings. Empty array = valid. */
export function validateStory(story: StoryInput): string[] {
  const errors: string[] = [];
  const keys = Object.keys(story.pages);

  if (story.readers.length === 0) {
    errors.push("readers list is empty");
  }

  if (!(story.start in story.pages)) {
    errors.push(`start page "${story.start}" does not exist`);
  }

  for (const [key, pageData] of Object.entries(story.pages)) {
    const isEnding = pageData.ending !== undefined;
    const choices = pageData.choices ?? [];

    if (isEnding && choices.length > 0) {
      errors.push(`page "${key}" is an ending but has choices`);
    }
    if (!isEnding && choices.length === 0) {
      errors.push(`page "${key}" is not an ending but has no choices`);
    }
    for (const c of choices) {
      if (!keys.includes(c.to)) {
        errors.push(`page "${key}" choice -> "${c.to}" targets a missing page`);
      }
    }
  }

  return errors;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/stories/validate.test.ts`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stories/validate.ts lib/stories/validate.test.ts
git commit -m "feat: add story validation with tests"
```

---

## Task 9: Sample story

**Files:**
- Create: `content/stories/bean-whispering-woods.ts`

- [ ] **Step 1: Write the sample story**

```ts
// content/stories/bean-whispering-woods.ts
import { defineStory } from "./_story-types";

export default defineStory({
  slug: "bean-whispering-woods",
  title: "Bean and the Whispering Woods",
  description: "A little bear explores a magical forest and chooses his own path.",
  readers: ["milo"],
  start: "forest-edge",
  pages: {
    "forest-edge": {
      body: "Bean the little bear stood at the edge of the dark, whispering woods. The trees seemed to hum a soft song just for him. What should Bean do?",
      choices: [
        { label: "🌲 Step into the woods", to: "deep-woods" },
        { label: "🏡 Go back home", to: "cozy-home" },
      ],
    },
    "deep-woods": {
      body: "Inside the woods, moonlight sparkled on the leaves. Bean heard a tiny voice say, \"Hello!\" It was a little firefly named Glimmer.",
      choices: [
        { label: "👋 Say hello to Glimmer", to: "glimmer-friend" },
        { label: "🍄 Follow the glowing mushrooms", to: "mushroom-path" },
      ],
    },
    "mushroom-path": {
      body: "The glowing mushrooms led Bean to a warm little clearing where Glimmer was waiting with a picnic of honey and berries.",
      choices: [{ label: "🧺 Join the picnic", to: "glimmer-friend" }],
    },
    "glimmer-friend": {
      body: "Bean and Glimmer became the best of friends. They watched the stars until Bean grew sleepy and floated home on a happy dream.",
      ending: "The Friendly Ending",
    },
    "cozy-home": {
      body: "Bean decided the woods could wait for another day. He curled up by the fire with warm cocoa and his favorite blanket.",
      ending: "The Snug Ending",
    },
  },
});
```

- [ ] **Step 2: Type-check the story file**

Run: `npx tsc --noEmit`
Expected: no type errors (all `to:` targets and `start` are valid keys).

- [ ] **Step 3: Commit**

```bash
git add content/stories/bean-whispering-woods.ts
git commit -m "content: add sample story Bean and the Whispering Woods"
```

---

## Task 10: Seed script

**Files:**
- Create: `scripts/seed-stories.ts`

The seed script is verified by running it against Neon and re-running it (idempotency), not by a unit test — its pure logic (`validateStory`) is already tested.

- [ ] **Step 1a: Create `scripts/_env.ts` (env loader for standalone scripts)**

Standalone `tsx` scripts do NOT get Next.js's automatic `.env.local` loading, and a plain `import "dotenv/config"` only reads `.env`. This side-effect module loads `.env.local` first. It MUST be imported before any module that reads `process.env` at load time (e.g. `db/client`, which throws if `DATABASE_URL` is unset). Because ES module imports are evaluated in source order, a bare side-effect import placed first runs before `db/client` is evaluated.

```ts
// scripts/_env.ts
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env if present (does not override already-set vars)
```

- [ ] **Step 1b: Write `scripts/seed-stories.ts`**

```ts
// scripts/seed-stories.ts
import "./_env"; // MUST be first: loads .env.local before db/client reads DATABASE_URL
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { user, story, page, choice, storyAccess } from "@/db/schema";
import { validateStory } from "@/lib/stories/validate";
import type { StoryInput } from "@/content/stories/_story-types";

const STORIES_DIR = join(process.cwd(), "content", "stories");

async function loadStories(): Promise<StoryInput[]> {
  const files = readdirSync(STORIES_DIR).filter(
    (f) => f.endsWith(".ts") && !f.startsWith("_"),
  );
  const stories: StoryInput[] = [];
  for (const file of files) {
    const mod = await import(join(STORIES_DIR, file));
    stories.push(mod.default as StoryInput);
  }
  return stories;
}

async function seedStory(input: StoryInput) {
  const errors = validateStory(input);
  if (errors.length > 0) {
    throw new Error(`Story "${input.slug}" is invalid:\n - ${errors.join("\n - ")}`);
  }

  // Map reader usernames -> user ids. Missing readers are a hard error.
  const readers = await db
    .select({ id: user.id, username: user.username })
    .from(user)
    .where(inArray(user.username, input.readers));
  const foundUsernames = new Set(readers.map((r) => r.username));
  const missing = input.readers.filter((u) => !foundUsernames.has(u));
  if (missing.length > 0) {
    throw new Error(`Story "${input.slug}" references unknown readers: ${missing.join(", ")}`);
  }

  // Upsert story row.
  const [storyRow] = await db
    .insert(story)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description ?? "",
      coverImageUrl: input.coverImageUrl ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: story.slug,
      set: {
        title: input.title,
        description: input.description ?? "",
        coverImageUrl: input.coverImageUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Full replace of pages/choices for a clean re-seed (cascade deletes choices).
  await db.delete(page).where(eq(page.storyId, storyRow.id));

  // Insert pages, capture key -> id.
  const keyToId = new Map<string, number>();
  for (const [key, p] of Object.entries(input.pages)) {
    const [pageRow] = await db
      .insert(page)
      .values({
        storyId: storyRow.id,
        key,
        body: p.body,
        imageUrl: p.imageUrl ?? null,
        isEnding: p.ending !== undefined,
        endingLabel: p.ending ?? null,
      })
      .returning({ id: page.id });
    keyToId.set(key, pageRow.id);
  }

  // Set start page id.
  await db
    .update(story)
    .set({ startPageId: keyToId.get(input.start)! })
    .where(eq(story.id, storyRow.id));

  // Insert choices.
  for (const [key, p] of Object.entries(input.pages)) {
    const fromId = keyToId.get(key)!;
    const choices = p.choices ?? [];
    for (let i = 0; i < choices.length; i++) {
      await db.insert(choice).values({
        pageId: fromId,
        toPageKey: choices[i].to,
        label: choices[i].label,
        order: i,
      });
    }
  }

  // Reset access rows for this story, then insert.
  await db.delete(storyAccess).where(eq(storyAccess.storyId, storyRow.id));
  for (const r of readers) {
    await db.insert(storyAccess).values({ storyId: storyRow.id, readerId: r.id });
  }

  console.log(`Seeded "${input.slug}" (${Object.keys(input.pages).length} pages, ${readers.length} readers)`);
}

async function main() {
  const stories = await loadStories();
  console.log(`Found ${stories.length} story file(s).`);
  for (const s of stories) {
    await seedStory(s);
  }
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Create a reader to seed against**

The sample story references reader `milo`, and readers are BetterAuth users created in the next plan. For now, insert a placeholder reader row directly so seeding can be verified:

Run (uses raw `neon` and reads `DATABASE_URL` at call time — after `config()` — to sidestep the module-load-order trap; loads `.env.local` explicitly):
```bash
npx tsx -e "import {config} from 'dotenv'; import {neon} from '@neondatabase/serverless'; config({path:'.env.local'}); const sql=neon(process.env.DATABASE_URL); await sql\`insert into \"user\" (id,name,email,email_verified,username,display_name,theme) values ('seed-milo','Milo','milo@example.com',false,'milo','Milo','cozy') on conflict do nothing\`; console.log('ok');"
```
Expected: prints `ok`.

- [ ] **Step 3: Run the seed and verify**

Run: `npm run db:seed`
Expected: prints `Found 1 story file(s).`, `Seeded "bean-whispering-woods" (5 pages, 1 readers)`, `Seed complete.`

- [ ] **Step 4: Verify idempotency**

Run: `npm run db:seed` again.
Expected: same output, no duplicate-key errors, still 5 pages for the story in Neon.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-stories.ts
git commit -m "feat: add validated, idempotent story seed script"
```

---

## Self-Review Notes

- Spec coverage: schema (§Data Model) → Task 6; story format (§Story Authoring Format) → Tasks 7–9; seed pipeline + validation rules → Tasks 8, 10; sample story → Task 9. Auth wiring, library, reader, and theming are covered by subsequent plans (02–04).
- `reader.username` from the spec fix is present on the `user` table and used by the seed's reader mapping.
- The placeholder-reader step (Task 10 Step 2) is a temporary bridge; the auth plan replaces `milo` with a real BetterAuth signup and documents removing the placeholder row.
