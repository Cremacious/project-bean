# Auth & Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up BetterAuth (email/password) with our extended `user`/reader fields, add sign-in and sign-out, protect routes, and build the access-gated Library page showing only the signed-in reader's stories.

**Architecture:** BetterAuth runs on a catch-all route handler backed by the Drizzle adapter over Neon. A server helper reads the session in Server Components. The Library is a Server Component that queries `storyAccess` joined to `story` for the current reader. Middleware redirects unauthenticated users to `/sign-in`.

**Tech Stack:** BetterAuth, Drizzle ORM, Next.js App Router (Server Components, Route Handlers, Middleware), shadcn/ui.

**Prerequisite:** Plan 01 complete (schema pushed, seed script working).

---

## File Structure (created by this plan)

- `lib/auth.ts` — BetterAuth server instance (Drizzle adapter, extra reader fields).
- `lib/auth-client.ts` — BetterAuth React client for Client Components.
- `app/api/auth/[...all]/route.ts` — auth route handler.
- `lib/session.ts` — `getReader()` server helper.
- `middleware.ts` — redirect unauthenticated users.
- `app/sign-in/page.tsx` — sign-in form (Client Component).
- `app/(app)/layout.tsx` — authed shell with header + sign-out.
- `app/(app)/page.tsx` — the Library (Server Component).
- `lib/stories/queries.ts` — reader-scoped story queries.
- `scripts/create-reader.ts` — CLI to create a reader account.

---

## Task 1: BetterAuth server instance

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Write `lib/auth.ts`**

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

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
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      username: { type: "string", required: true, input: true },
      displayName: { type: "string", required: true, input: true },
      theme: { type: "string", required: false, input: true, defaultValue: "cozy" },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
```

Note: BetterAuth's `name` field is required by its core schema; the reader's `displayName` is our own field. When creating readers we set both `name` and `displayName`.

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors. If BetterAuth's current version renames an option, consult https://www.better-auth.com/docs and adjust the option name, keeping the same three additional fields.

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add BetterAuth server instance with reader fields"
```

---

## Task 2: Auth route handler and client

**Files:**
- Create: `app/api/auth/[...all]/route.ts`, `lib/auth-client.ts`

- [ ] **Step 1: Write the route handler**

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Write the client**

```ts
// lib/auth-client.ts
"use client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signOut, useSession } = authClient;
```

- [ ] **Step 3: Add `NEXT_PUBLIC_APP_URL` to env files**

In `.env.local` and `.env.example` add:
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 4: Verify the auth endpoint responds**

Run: `npm run dev`, then in another terminal:
```bash
curl -s http://localhost:3000/api/auth/ok
```
Expected: a JSON response from BetterAuth (e.g. `{"ok":true}`), not a 404. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/api/auth lib/auth-client.ts .env.example
git commit -m "feat: add auth route handler and client"
```

---

## Task 3: Reader creation script

**Files:**
- Create: `scripts/create-reader.ts`
- Modify: `package.json` (add `create-reader` script)

Because readers are children whose accounts an adult manages, accounts are created via a CLI rather than public sign-up.

- [ ] **Step 1: Write `scripts/create-reader.ts`**

```ts
// scripts/create-reader.ts
import "./_env"; // MUST be first: loads .env.local before lib/auth -> db/client reads env
import { auth } from "@/lib/auth";

// Usage: npx tsx scripts/create-reader.ts <email> <password> <username> <displayName>
async function main() {
  const [email, password, username, displayName] = process.argv.slice(2);
  if (!email || !password || !username || !displayName) {
    console.error("Usage: tsx scripts/create-reader.ts <email> <password> <username> <displayName>");
    process.exit(1);
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name: displayName, username, displayName },
  });

  console.log(`Created reader "${username}" (${email})`, result.user?.id ?? "");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add script to package.json**

In `"scripts"` add:
```json
"create-reader": "tsx scripts/create-reader.ts"
```

- [ ] **Step 3: Create the real `milo` reader and remove the placeholder**

First delete the placeholder row from Plan 01 Task 10:
```bash
npx tsx -e "import 'dotenv/config'; import {db} from './db/client'; import {user} from './db/schema'; import {eq} from 'drizzle-orm'; await db.delete(user).where(eq(user.id,'seed-milo')); console.log('removed');"
```
Then create the real account:
```bash
npm run create-reader -- milo@example.com "storytime123" milo "Milo"
```
Expected: `Created reader "milo" (milo@example.com) <id>`.

- [ ] **Step 4: Re-seed so story access points at the real reader id**

```bash
npm run db:seed
```
Expected: `Seeded "bean-whispering-woods" (5 pages, 1 readers)`.

- [ ] **Step 5: Commit**

```bash
git add scripts/create-reader.ts package.json
git commit -m "feat: add CLI to create reader accounts"
```

---

## Task 4: Session helper

**Files:**
- Create: `lib/session.ts`

- [ ] **Step 1: Write `lib/session.ts`**

```ts
// lib/session.ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type Reader = {
  id: string;
  username: string;
  displayName: string;
  theme: string;
};

/** Returns the signed-in reader, or null. Safe to call in Server Components. */
export async function getReader(): Promise<Reader | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as unknown as Reader & Record<string, unknown>;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    theme: u.theme ?? "cozy",
  };
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/session.ts
git commit -m "feat: add getReader session helper"
```

---

## Task 5: Middleware route protection

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write `middleware.ts`**

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/sign-in", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Note: middleware only checks cookie presence (fast, Edge-safe). Real session validation happens in Server Components via `getReader()`.

- [ ] **Step 2: Verify redirect behavior**

Run: `npm run dev`. Visit http://localhost:3000/ while signed out.
Expected: redirected to `/sign-in`. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware protecting app routes"
```

---

## Task 6: Sign-in page

**Files:**
- Create: `app/sign-in/page.tsx`

- [ ] **Step 1: Write the sign-in page**

```tsx
// app/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Storytime</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Verify sign-in works end to end**

Run: `npm run dev`. Visit `/sign-in`, sign in as `milo@example.com` / `storytime123`.
Expected: redirected to `/` (which currently 404s or shows default — that's fixed in Task 8). The session cookie is set (check DevTools → Application → Cookies). Stop the server.

- [ ] **Step 3: Commit**

```bash
git add app/sign-in/page.tsx
git commit -m "feat: add sign-in page"
```

---

## Task 7: Reader-scoped story queries

**Files:**
- Create: `lib/stories/queries.ts`

- [ ] **Step 1: Write the query module**

```ts
// lib/stories/queries.ts
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { story, storyAccess } from "@/db/schema";

export type StoryCard = {
  id: number;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
};

/** Stories the given reader is allowed to see. */
export async function getLibraryForReader(readerId: string): Promise<StoryCard[]> {
  const rows = await db
    .select({
      id: story.id,
      slug: story.slug,
      title: story.title,
      description: story.description,
      coverImageUrl: story.coverImageUrl,
    })
    .from(story)
    .innerJoin(storyAccess, eq(storyAccess.storyId, story.id))
    .where(eq(storyAccess.readerId, readerId))
    .orderBy(story.title);
  return rows;
}

/** Returns the story row if the reader may access it, else null. */
export async function getAccessibleStoryBySlug(readerId: string, slug: string) {
  const [row] = await db
    .select({
      id: story.id,
      slug: story.slug,
      title: story.title,
      startPageId: story.startPageId,
    })
    .from(story)
    .innerJoin(storyAccess, eq(storyAccess.storyId, story.id))
    .where(and(eq(story.slug, slug), eq(storyAccess.readerId, readerId)))
    .limit(1);
  return row ?? null;
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/stories/queries.ts
git commit -m "feat: add reader-scoped story queries"
```

---

## Task 8: Authed shell + Library page

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `components/sign-out-button.tsx`

- [ ] **Step 1: Write the sign-out button (Client Component)**

```tsx
// components/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
```

- [ ] **Step 2: Write the authed layout**

```tsx
// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getReader } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect("/sign-in");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <span className="font-semibold">Storytime</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {reader.displayName}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write the Library page**

```tsx
// app/(app)/page.tsx
import Link from "next/link";
import { getReader } from "@/lib/session";
import { getLibraryForReader } from "@/lib/stories/queries";
import { Card } from "@/components/ui/card";

export default async function LibraryPage() {
  const reader = (await getReader())!; // layout guarantees non-null
  const stories = await getLibraryForReader(reader.id);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Choose a story</h1>
      {stories.length === 0 ? (
        <p className="text-muted-foreground">No stories yet. Check back soon!</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stories.map((s) => (
            <Link key={s.id} href={`/story/${s.slug}`}>
              <Card className="p-5 h-full hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Remove the default scaffolded home page**

Delete `app/page.tsx` (the create-next-app default) so `app/(app)/page.tsx` serves `/`. Keep `app/layout.tsx` (root layout).

- [ ] **Step 5: Verify the library**

Run: `npm run dev`. Sign in as `milo`.
Expected: `/` shows the header with "Hi, Milo" and a card for "Bean and the Whispering Woods". Clicking it navigates to `/story/bean-whispering-woods` (404 until Plan 03). Sign out returns to `/sign-in`. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)" components/sign-out-button.tsx
git rm app/page.tsx
git commit -m "feat: add authed shell and access-gated library"
```

---

## Self-Review Notes

- Spec coverage: BetterAuth email/password → Tasks 1–2; account-per-reader created by adult → Task 3 CLI; session gating → Tasks 4–5; sign-in → Task 6; Library shows only accessible stories (§Reader Experience step 1) → Tasks 7–8.
- Access control is enforced in the query (`innerJoin storyAccess`), not just the UI — a reader cannot load a story they lack access to (`getAccessibleStoryBySlug` returns null), which Plan 03 relies on.
- Type consistency: `getReader()` returns `{id, username, displayName, theme}`, used unchanged by layout/library. `getAccessibleStoryBySlug` returns `startPageId` consumed by Plan 03.
