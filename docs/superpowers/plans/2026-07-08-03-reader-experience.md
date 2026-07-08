# Reader Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the client-side story reader: load an accessible story's full page graph on the server, render the current page + choices as a Client Component, navigate choices instantly with URL sync, and show an ending screen that records the discovered ending and reports progress ("You've found 3 of 5 endings").

**Architecture:** A Server Component route (`/story/[slug]`) validates access, loads the whole story graph, and computes ending progress, then hands a plain-data prop to a Client Component (`StoryReader`) that owns navigation state. Reaching an ending calls a Server Action to upsert `endingFound`.

**Tech Stack:** Next.js App Router (Server Components, Server Actions, `useSearchParams`), Drizzle, Vitest for pure logic.

**Prerequisite:** Plans 01 and 02 complete.

---

## File Structure (created by this plan)

- `lib/stories/graph.ts` — types + loader assembling a story into an in-memory graph; ending-progress query.
- `lib/stories/graph.test.ts` — Vitest tests for the pure graph-shaping helper.
- `lib/stories/actions.ts` — `recordEnding` Server Action.
- `app/(app)/story/[slug]/page.tsx` — Server Component route.
- `components/story/story-reader.tsx` — Client Component reader.
- `components/story/ending-screen.tsx` — Client Component ending view.

---

## Task 1: Story graph types + pure shaper (TDD)

The DB returns flat rows; the client needs a keyed graph. The pure transformation is tested; the DB round-trip is verified by running the app.

**Files:**
- Create: `lib/stories/graph.ts`
- Test: `lib/stories/graph.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/stories/graph.test.ts
import { describe, it, expect } from "vitest";
import { buildStoryGraph, type PageRow, type ChoiceRow } from "./graph";

const pages: PageRow[] = [
  { id: 1, key: "a", body: "start", isEnding: false, endingLabel: null, imageUrl: null },
  { id: 2, key: "b", body: "the end", isEnding: true, endingLabel: "The End", imageUrl: null },
];
const choices: ChoiceRow[] = [
  { pageId: 1, toPageKey: "b", label: "go", order: 0 },
];

describe("buildStoryGraph", () => {
  it("keys pages by their key and attaches ordered choices", () => {
    const graph = buildStoryGraph(pages, choices);
    expect(Object.keys(graph.pages)).toEqual(["a", "b"]);
    expect(graph.pages.a.choices).toEqual([{ label: "go", to: "b" }]);
    expect(graph.pages.b.isEnding).toBe(true);
    expect(graph.pages.b.endingLabel).toBe("The End");
  });

  it("sorts choices by order", () => {
    const c: ChoiceRow[] = [
      { pageId: 1, toPageKey: "b", label: "second", order: 1 },
      { pageId: 1, toPageKey: "b", label: "first", order: 0 },
    ];
    const graph = buildStoryGraph(pages, c);
    expect(graph.pages.a.choices.map((x) => x.label)).toEqual(["first", "second"]);
  });

  it("counts ending pages", () => {
    const graph = buildStoryGraph(pages, choices);
    expect(graph.totalEndings).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/stories/graph.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/stories/graph.ts
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { page as pageTable, choice as choiceTable, endingFound } from "@/db/schema";
import { and } from "drizzle-orm";

export type PageRow = {
  id: number;
  key: string;
  body: string;
  isEnding: boolean;
  endingLabel: string | null;
  imageUrl: string | null;
};

export type ChoiceRow = {
  pageId: number;
  toPageKey: string;
  label: string;
  order: number;
};

export type GraphChoice = { label: string; to: string };

export type GraphPage = {
  id: number;
  key: string;
  body: string;
  imageUrl: string | null;
  isEnding: boolean;
  endingLabel: string | null;
  choices: GraphChoice[];
};

export type StoryGraph = {
  pages: Record<string, GraphPage>;
  totalEndings: number;
};

/** Pure: turn flat page/choice rows into a keyed graph. */
export function buildStoryGraph(pages: PageRow[], choices: ChoiceRow[]): StoryGraph {
  const byId = new Map<number, GraphPage>();
  const graph: StoryGraph = { pages: {}, totalEndings: 0 };

  for (const p of pages) {
    const gp: GraphPage = {
      id: p.id,
      key: p.key,
      body: p.body,
      imageUrl: p.imageUrl,
      isEnding: p.isEnding,
      endingLabel: p.endingLabel,
      choices: [],
    };
    graph.pages[p.key] = gp;
    byId.set(p.id, gp);
    if (p.isEnding) graph.totalEndings += 1;
  }

  const sorted = [...choices].sort((a, b) => a.order - b.order);
  for (const c of sorted) {
    const from = byId.get(c.pageId);
    if (from) from.choices.push({ label: c.label, to: c.toPageKey });
  }

  return graph;
}

/** Load a story's full graph from the DB. */
export async function loadStoryGraph(storyId: number): Promise<StoryGraph> {
  const pages = await db
    .select({
      id: pageTable.id,
      key: pageTable.key,
      body: pageTable.body,
      isEnding: pageTable.isEnding,
      endingLabel: pageTable.endingLabel,
      imageUrl: pageTable.imageUrl,
    })
    .from(pageTable)
    .where(eq(pageTable.storyId, storyId));

  const pageIds = pages.map((p) => p.id);
  const choices =
    pageIds.length === 0
      ? []
      : await db
          .select({
            pageId: choiceTable.pageId,
            toPageKey: choiceTable.toPageKey,
            label: choiceTable.label,
            order: choiceTable.order,
          })
          .from(choiceTable);

  // Filter choices to this story's pages (choices table has no storyId).
  const idSet = new Set(pageIds);
  return buildStoryGraph(pages, choices.filter((c) => idSet.has(c.pageId)));
}

/** How many distinct endings this reader has found in this story. */
export async function countEndingsFound(readerId: string, storyId: number): Promise<number> {
  const rows = await db
    .select({ pageId: endingFound.pageId })
    .from(endingFound)
    .where(and(eq(endingFound.readerId, readerId), eq(endingFound.storyId, storyId)));
  return rows.length;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/stories/graph.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/stories/graph.ts lib/stories/graph.test.ts
git commit -m "feat: add story graph builder and loaders with tests"
```

---

## Task 2: recordEnding server action

**Files:**
- Create: `lib/stories/actions.ts`

- [ ] **Step 1: Write the action**

```ts
// lib/stories/actions.ts
"use server";

import { getReader } from "@/lib/session";
import { getAccessibleStoryBySlug } from "@/lib/stories/queries";
import { countEndingsFound } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable, endingFound } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Records that the signed-in reader reached the given ending page.
 * Returns updated progress. Ignores non-ending pages and inaccessible stories.
 */
export async function recordEnding(
  slug: string,
  pageKey: string,
): Promise<{ found: number; total: number } | null> {
  const reader = await getReader();
  if (!reader) return null;

  const story = await getAccessibleStoryBySlug(reader.id, slug);
  if (!story) return null;

  const [pageRow] = await db
    .select({ id: pageTable.id, isEnding: pageTable.isEnding })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.key, pageKey)))
    .limit(1);

  if (!pageRow || !pageRow.isEnding) return null;

  await db
    .insert(endingFound)
    .values({ readerId: reader.id, storyId: story.id, pageId: pageRow.id })
    .onConflictDoNothing();

  const found = await countEndingsFound(reader.id, story.id);

  // total endings for this story
  const endings = await db
    .select({ id: pageTable.id })
    .from(pageTable)
    .where(and(eq(pageTable.storyId, story.id), eq(pageTable.isEnding, true)));

  return { found, total: endings.length };
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/stories/actions.ts
git commit -m "feat: add recordEnding server action"
```

---

## Task 3: Ending screen component

**Files:**
- Create: `components/story/ending-screen.tsx`

- [ ] **Step 1: Write the ending screen**

```tsx
// components/story/ending-screen.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EndingScreen({
  endingLabel,
  progress,
  onReadAgain,
}: {
  endingLabel: string | null;
  progress: { found: number; total: number } | null;
  onReadAgain: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-10">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">The End</p>
      {endingLabel && <h2 className="text-3xl font-semibold">{endingLabel}</h2>}
      {progress && (
        <p className="text-lg">
          You&apos;ve found <strong>{progress.found}</strong> of{" "}
          <strong>{progress.total}</strong> endings!
        </p>
      )}
      <div className="flex items-center justify-center gap-3">
        <Button onClick={onReadAgain}>Read again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to library</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/story/ending-screen.tsx
git commit -m "feat: add ending screen component"
```

---

## Task 4: StoryReader client component

**Files:**
- Create: `components/story/story-reader.tsx`

- [ ] **Step 1: Write the reader**

```tsx
// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StoryGraph } from "@/lib/stories/graph";
import { recordEnding } from "@/lib/stories/actions";
import { EndingScreen } from "@/components/story/ending-screen";
import { Button } from "@/components/ui/button";

export function StoryReader({
  slug,
  startKey,
  graph,
}: {
  slug: string;
  startKey: string;
  graph: StoryGraph;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("p");
  const initialKey = urlKey && graph.pages[urlKey] ? urlKey : startKey;

  const [currentKey, setCurrentKey] = useState(initialKey);
  const [progress, setProgress] = useState<{ found: number; total: number } | null>(null);

  const current = graph.pages[currentKey] ?? graph.pages[startKey];

  // Keep the URL in sync (shallow) so refresh/bookmark restores position.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("p", currentKey);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [currentKey, searchParams]);

  // When we land on an ending, record it.
  useEffect(() => {
    if (current.isEnding) {
      recordEnding(slug, current.key).then((p) => {
        if (p) setProgress(p);
      });
    }
  }, [current.isEnding, current.key, slug]);

  const goTo = useCallback((key: string) => {
    setProgress(null);
    setCurrentKey(key);
  }, []);

  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  if (current.isEnding) {
    return (
      <EndingScreen
        endingLabel={current.endingLabel}
        progress={progress}
        onReadAgain={readAgain}
      />
    );
  }

  return (
    <article className="space-y-8">
      <p className="text-xl leading-relaxed whitespace-pre-line">{current.body}</p>
      <div className="flex flex-col gap-3">
        {current.choices.map((c, i) => (
          <Button
            key={`${c.to}-${i}`}
            size="lg"
            variant="secondary"
            className="justify-start text-left h-auto py-4 text-lg whitespace-normal"
            onClick={() => goTo(c.to)}
          >
            {c.label}
          </Button>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/story/story-reader.tsx
git commit -m "feat: add client StoryReader with choice navigation"
```

---

## Task 5: Story route (Server Component)

**Files:**
- Create: `app/(app)/story/[slug]/page.tsx`

- [ ] **Step 1: Write the route**

```tsx
// app/(app)/story/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getReader } from "@/lib/session";
import { getAccessibleStoryBySlug } from "@/lib/stories/queries";
import { loadStoryGraph } from "@/lib/stories/graph";
import { db } from "@/db/client";
import { page as pageTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StoryReader } from "@/components/story/story-reader";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reader = (await getReader())!; // (app) layout guarantees non-null

  const story = await getAccessibleStoryBySlug(reader.id, slug);
  if (!story) notFound();

  const graph = await loadStoryGraph(story.id);

  // Resolve the start page key from startPageId.
  let startKey: string | undefined;
  if (story.startPageId != null) {
    const [row] = await db
      .select({ key: pageTable.key })
      .from(pageTable)
      .where(eq(pageTable.id, story.startPageId))
      .limit(1);
    startKey = row?.key;
  }
  if (!startKey) startKey = Object.keys(graph.pages)[0];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">{story.title}</h1>
      <Suspense>
        <StoryReader slug={slug} startKey={startKey} graph={graph} />
      </Suspense>
    </div>
  );
}
```

Note: `StoryReader` uses `useSearchParams`, so it is wrapped in `<Suspense>`.

- [ ] **Step 2: Verify the full reading flow**

Run: `npm run dev`. Sign in as `milo`, open "Bean and the Whispering Woods".
Expected:
- Page 1 text + two choice buttons render.
- Clicking "Step into the woods" advances; the URL gains `?p=deep-woods`.
- Following a path to an ending shows the ending screen with its label and "You've found 1 of 2 endings!".
- "Read again" restarts from page one. "Back to library" returns to `/`.
- Refreshing mid-story (`?p=deep-woods`) resumes on that page.
- Reaching the *other* ending updates progress to "2 of 2".
Stop the server.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/story"
git commit -m "feat: add story reader route with access gating"
```

---

## Self-Review Notes

- Spec coverage: client reader (§Architecture, §Reader Experience 2) → Tasks 4–5; branching graph navigation → Task 1 + StoryReader; URL reflects position → StoryReader effect; ending screen with progress (§Reader Experience 3) → Tasks 2–3; endings tracked in `endingFound` → Task 2.
- Access enforced server-side: `getAccessibleStoryBySlug` → `notFound()`; `recordEnding` re-checks access and that the page is actually an ending before writing.
- Type consistency: `StoryGraph`/`GraphPage` from Task 1 are the exact prop types consumed by `StoryReader` (Task 4) and produced by `loadStoryGraph` (Task 5). `recordEnding` returns `{found,total}` matching `EndingScreen`'s `progress` prop.
- Known simplification: `loadStoryGraph` fetches all choices then filters by this story's page ids (the `choice` table has no `storyId`). Acceptable at personal scale; if the library grows large, add a `storyId` column to `choice` and filter in SQL.
