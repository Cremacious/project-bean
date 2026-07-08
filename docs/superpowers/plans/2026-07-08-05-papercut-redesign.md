# Paper Cut Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app's default shadcn styling with the "Paper Cut" identity across every screen, add reader accessibility controls (text size + reading font, saved to profile), and make the app mobile-first responsive.

**Architecture:** Self-hosted fonts via `next/font` (+ `@fontsource/opendyslexic`). A single Paper Cut token set in `app/globals.css` maps shadcn's CSS variables so primitives inherit the look. The 3-theme switcher is removed. Reading prefs live on the `user` row and apply as inline CSS variables on the story prose. All layouts are mobile-first Tailwind.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/Base UI, Drizzle/Neon, next/font.

**Prerequisite:** The app is built and working on branch `build/story-site` (auth = single env credential). Visual truth = the two approved artifacts referenced in the design spec.

---

## Phase 1 — Foundation (fonts, tokens, remove theming)

### Task 1: Fonts

**Files:** Create `app/fonts.ts`; modify `app/layout.tsx`; add dep `@fontsource/opendyslexic`.

- [ ] **Step 1: Install OpenDyslexic** (Google Fonts lacks it): `npm i @fontsource/opendyslexic`

- [ ] **Step 2: Create `app/fonts.ts`**
```ts
// app/fonts.ts
import { Baloo_2, Nunito_Sans, Atkinson_Hyperlegible } from "next/font/google";

export const baloo = Baloo_2({
  subsets: ["latin"], weight: ["600", "700", "800"],
  variable: "--font-baloo", display: "swap",
});
export const nunito = Nunito_Sans({
  subsets: ["latin"], weight: ["400", "600", "700"],
  variable: "--font-nunito", display: "swap",
});
export const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"], weight: ["400", "700"],
  variable: "--font-atkinson", display: "swap",
});
```

- [ ] **Step 3: Wire into `app/layout.tsx`** — put the three `.variable` classes on `<html>`, import the OpenDyslexic CSS, and keep the body defaulting to Nunito. Replace the file's font wiring so the root layout looks like:
```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "@fontsource/opendyslexic/400.css";
import "@fontsource/opendyslexic/700.css";
import "./globals.css";
import { baloo, nunito, atkinson } from "./fonts";

export const metadata: Metadata = {
  title: "Storytime",
  description: "Interactive bedtime stories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${atkinson.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```
(Preserve any existing metadata/props the scaffold added; only the font wiring and imports must match the above.)

- [ ] **Step 4: Verify** `npm run build` passes and fonts resolve (no next/font errors). Commit:
```
git add app/fonts.ts app/layout.tsx package.json package-lock.json
git commit -m "feat(ui): add self-hosted Baloo 2, Nunito Sans, Atkinson, OpenDyslexic fonts"
```

### Task 2: Paper Cut tokens in `app/globals.css`

**Files:** modify `app/globals.css`.

- [ ] **Step 1:** In `app/globals.css`, keep the `@import`s and the `@theme inline { … }` block. **Replace** the entire theme section — i.e. the existing `:root { … }`, `.dark { … }`, and the three `[data-theme] { … }` Storytime blocks (added in the previous theming work) — with the single Paper Cut token set below. Also set the display/sans font vars and the reader-prose base. Do NOT edit `@theme inline`.
```css
:root {
  /* Paper Cut palette */
  --background: #EAF2FB;
  --foreground: #16283A;
  --card: #FFFFFF;
  --card-foreground: #16283A;
  --popover: #FFFFFF;
  --popover-foreground: #16283A;
  --primary: #574BC0;            /* plum-ink: white text passes AA */
  --primary-foreground: #FFFFFF;
  --secondary: #FFFFFF;
  --secondary-foreground: #16283A;
  --muted: #DCEAFB;
  --muted-foreground: #5A7089;
  --accent: #F0EEFF;
  --accent-foreground: #574BC0;
  --destructive: #E14A2B;
  --border: #D4E3F2;
  --input: #D4E3F2;
  --ring: #6C5CE7;
  --radius: 0.9rem;

  /* Paper Cut brights (decoration) + ink variants (white-text fills) */
  --pc-sky: #EAF2FB;
  --pc-ink: #16283A;
  --pc-sub: #5A7089;
  --pc-line: #D4E3F2;
  --pc-poppy: #FF6B4A;   --pc-poppy-ink: #E14A2B;
  --pc-leaf: #2FB98A;    --pc-leaf-ink: #1E8F6A;
  --pc-sun: #FFC24B;
  --pc-plum: #6C5CE7;    --pc-plum-ink: #574BC0;

  /* Fonts */
  --font-sans: var(--font-nunito);
  --font-display: var(--font-baloo);
}

/* Story prose — size & font are set inline by the reader via these vars */
.reader-prose {
  font-family: var(--reading-font, var(--font-nunito));
  font-size: var(--reading-size, 1.125rem);
  line-height: var(--reading-lh, 1.6);
  font-weight: 600;
  color: var(--pc-ink);
  text-wrap: pretty;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```
Keep the existing `@layer base { * { @apply border-border … } body { @apply bg-background text-foreground; } }` block, but change the `html { @apply font-sans }` rule to also apply the display font to headings if present, or leave `font-sans` (Nunito) as the body default — Baloo is applied per-element via `font-[family-name:var(--font-display)]` utility or a `.font-display` helper. Add this helper at the end of the file:
```css
.font-display { font-family: var(--font-display); }
```

- [ ] **Step 2:** Verify `npm run build` passes; run `npm run dev` and confirm the app is now sky-blue with the new tokens (buttons plum, borders light-blue). Commit:
```
git add app/globals.css
git commit -m "feat(ui): replace theme tokens with single Paper Cut identity"
```

### Task 3: Remove the theme switcher

**Files:** delete `components/theme-switcher.tsx`, `lib/theme.ts`, `lib/theme-actions.ts`; modify `app/(app)/layout.tsx`.

- [ ] **Step 1:** `git rm components/theme-switcher.tsx lib/theme.ts lib/theme-actions.ts`
- [ ] **Step 2:** Edit `app/(app)/layout.tsx` — remove the `ThemeSwitcher` import/usage, the `isThemeId`/`ThemeId` import, and the `data-theme` attribute + `theme` computation. (The full new layout — including the redesigned header — is delivered in Task 5; for now just make it compile without the theme code.)
- [ ] **Step 3:** `npx tsc --noEmit` clean, `npm run build` passes. Commit:
```
git add -A
git commit -m "refactor(ui): remove 3-theme switcher (single identity)"
```

---

## Phase 2 — Library, header, StoryCover

### Task 4: StoryCover component

**Files:** create `components/story/story-cover.tsx`.

Deterministic paper-cut cover from the story slug — no images. ~5 motifs × palette rotation.

- [ ] **Step 1: Write `components/story/story-cover.tsx`**
```tsx
// components/story/story-cover.tsx
// Deterministic paper-cut cover art derived from the story slug. Pure CSS shapes.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const GROUNDS = ["#BFE3FF", "#FFE3D9", "#DCF5EA", "#EDE7FF", "#FFF1CC"];

export function StoryCover({ slug, className = "" }: { slug: string; className?: string }) {
  const h = hash(slug);
  const motif = h % 5;
  const ground = GROUNDS[(h >> 3) % GROUNDS.length];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: ground }}
      aria-hidden="true"
    >
      {motif === 0 && (
        <>
          <span className="absolute left-4 top-4 h-8 w-8 rounded-full" style={{ background: "var(--pc-sun)" }} />
          <span className="absolute inset-x-0 bottom-0 h-11" style={{ background: "var(--pc-leaf)", borderRadius: "100% 90% 0 0 / 44px 36px 0 0" }} />
        </>
      )}
      {motif === 1 && (
        <>
          <span className="absolute right-5 top-3 h-9 w-7" style={{ background: "var(--pc-poppy)", borderRadius: "50% 50% 46% 46%" }} />
          <span className="absolute left-4 bottom-4 h-6 w-6 rounded-full" style={{ background: "var(--pc-plum)" }} />
        </>
      )}
      {motif === 2 && (
        <>
          <span className="absolute inset-x-0 bottom-0 h-9" style={{ background: "#7FD8FF", borderRadius: "60% 40% 0 0 / 32px 24px 0 0" }} />
          <span className="absolute right-6 bottom-5 h-6 w-10" style={{ background: "#8C93A8", borderRadius: "40% 50% 20% 30%" }} />
        </>
      )}
      {motif === 3 && (
        <>
          <span className="absolute left-5 top-4 h-9 w-9 rotate-[-8deg] rounded-xl" style={{ background: "var(--pc-plum)" }} />
          <span className="absolute inset-x-0 bottom-0 h-10" style={{ background: "var(--pc-sun)", borderRadius: "100% 90% 0 0 / 40px 32px 0 0" }} />
        </>
      )}
      {motif === 4 && (
        <>
          <span className="absolute left-1/2 top-4 h-10 w-10 -translate-x-1/2 rounded-full" style={{ background: "var(--pc-sun)" }} />
          <span className="absolute inset-x-0 bottom-0 h-8" style={{ background: "var(--pc-poppy)", borderRadius: "100% 100% 0 0 / 30px 30px 0 0" }} />
        </>
      )}
    </div>
  );
}
```
- [ ] **Step 2:** `npx tsc --noEmit` clean. Commit:
```
git add components/story/story-cover.tsx
git commit -m "feat(ui): add deterministic StoryCover paper-cut art"
```

### Task 5: Header + authed layout

**Files:** modify `app/(app)/layout.tsx`; create `components/app-header.tsx`.

- [ ] **Step 1: Write `components/app-header.tsx`** (client — holds the avatar menu). It shows the brand and an avatar button that opens a small menu with the reader name + Sign out. Reuse `signOutAction`.
```tsx
// components/app-header.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/lib/auth-actions";

export function AppHeader({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--pc-line)] bg-[var(--pc-sky)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-[var(--pc-ink)]">
          <span className="relative h-6 w-6 -rotate-6 rounded-lg" style={{ background: "var(--pc-poppy)" }}>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "var(--pc-sun)" }} />
          </span>
          Storytime
        </Link>
        <div className="flex-1" />
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="grid h-9 w-9 rotate-3 place-items-center rounded-xl font-display font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            style={{ background: "var(--pc-plum)" }}
          >
            {initial}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div role="menu" className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-[var(--pc-line)] bg-white p-1.5 shadow-xl">
                <p className="px-3 py-2 text-sm text-[var(--pc-sub)]">Reading as <b className="text-[var(--pc-ink)]">{displayName}</b></p>
                <button
                  role="menuitem"
                  onClick={async () => { await signOutAction(); router.push("/sign-in"); router.refresh(); }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--pc-ink)] hover:bg-[var(--muted)]"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Rewrite `app/(app)/layout.tsx`** to use the header and drop all theme code:
```tsx
// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getReader } from "@/lib/session";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-[var(--pc-sky)] text-[var(--pc-ink)]">
      <AppHeader displayName={reader.displayName} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
```
- [ ] **Step 3:** `npm run build` passes. Commit:
```
git add "app/(app)/layout.tsx" components/app-header.tsx
git commit -m "feat(ui): Paper Cut header with account menu"
```

### Task 6: Library page

**Files:** modify `app/(app)/page.tsx`.

- [ ] **Step 1: Rewrite `app/(app)/page.tsx`** — responsive grid + Paper Cut cards using `StoryCover`. Keep the data call (`getLibraryForReader`). Card is horizontal on phone, and the meta pill shows page/ending counts if available (use description only if counts aren't in `StoryCard`; do NOT invent fields — the current `StoryCard` has `{id,slug,title,description,coverImageUrl}`, so show title + description; a meta line reading "Tap to read" is fine until counts are added).
```tsx
// app/(app)/page.tsx
import Link from "next/link";
import { getReader } from "@/lib/session";
import { getLibraryForReader } from "@/lib/stories/queries";
import { StoryCover } from "@/components/story/story-cover";

export default async function LibraryPage() {
  const reader = (await getReader())!;
  const stories = await getLibraryForReader(reader.id);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Pick a{" "}
          <span className="relative inline-block">
            <span className="relative z-10">story</span>
            <span className="absolute inset-x-[-2px] bottom-1 z-0 h-2.5 -rotate-1 rounded" style={{ background: "var(--pc-sun)" }} />
          </span>
          , {reader.displayName}!
        </h1>
      </div>

      {stories.length === 0 ? (
        <p className="text-[var(--pc-sub)]">No stories yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <Link
              key={s.id}
              href={`/story/${s.slug}`}
              className="group flex overflow-hidden rounded-3xl border border-[var(--pc-line)] bg-white shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:-translate-y-0.5 sm:flex-col"
            >
              <StoryCover slug={s.slug} className="h-full min-h-[7rem] w-24 flex-none sm:h-28 sm:w-full" />
              <div className="flex flex-col gap-2 p-4">
                <h2 className="font-display text-lg font-bold leading-tight">{s.title}</h2>
                <p className="text-sm text-[var(--pc-sub)]">{s.description}</p>
                <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E6F7F0] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-leaf-ink)]">
                  ★ Tap to read
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
```
- [ ] **Step 2:** Verify in browser (sign in as milo): library shows Paper Cut cards, responsive (resize to mobile). Commit:
```
git add "app/(app)/page.tsx"
git commit -m "feat(ui): Paper Cut responsive library"
```

---

## Phase 3 — Reader + accessibility

### Task 7: Reading-pref columns + session

**Files:** modify `db/schema.ts`, `lib/session.ts`; generate migration.

- [ ] **Step 1:** In `db/schema.ts`, add to the `user` table (after `theme`):
```ts
  readerFont: text("reader_font").notNull().default("rounded"),
  readerFontSize: text("reader_font_size").notNull().default("md"),
```
- [ ] **Step 2:** `npm run db:generate` then `npm run db:push`. Confirm columns exist (`\d user` via a quick neon query as in prior seed tasks).
- [ ] **Step 3:** Extend `lib/session.ts`: add `readerFont` and `readerFontSize` to the `Reader` type and the select in `getReader()`, defaulting (`?? "rounded"`, `?? "md"`).
- [ ] **Step 4:** `npx tsc --noEmit` clean. Commit:
```
git add db/schema.ts drizzle lib/session.ts
git commit -m "feat: add reader font/size prefs to profile"
```

### Task 8: Reading-prefs constants + action

**Files:** create `lib/reading-prefs.ts` (constants — NO directive) and `lib/reading-prefs-actions.ts` (`"use server"`).

- [ ] **Step 1: `lib/reading-prefs.ts`**
```ts
// lib/reading-prefs.ts
export const READING_FONTS = [
  { id: "rounded", label: "Rounded", note: "Default", cssVar: "var(--font-nunito)" },
  { id: "hyperlegible", label: "Hyperlegible", note: "Extra clear", cssVar: "var(--font-atkinson)" },
  { id: "dyslexic", label: "OpenDyslexic", note: "Dyslexia-friendly", cssVar: "OpenDyslexic, sans-serif" },
] as const;

export const READING_SIZES = [
  { id: "sm", label: "Small", size: "1rem", lh: "1.55" },
  { id: "md", label: "Medium", size: "1.125rem", lh: "1.6" },
  { id: "lg", label: "Large", size: "1.375rem", lh: "1.62" },
  { id: "xl", label: "Huge", size: "1.625rem", lh: "1.6" },
] as const;

export type ReadingFontId = (typeof READING_FONTS)[number]["id"];
export type ReadingSizeId = (typeof READING_SIZES)[number]["id"];

export function isFontId(v: string): v is ReadingFontId { return READING_FONTS.some((f) => f.id === v); }
export function isSizeId(v: string): v is ReadingSizeId { return READING_SIZES.some((s) => s.id === v); }
export function fontCss(id: string) { return (READING_FONTS.find((f) => f.id === id) ?? READING_FONTS[0]).cssVar; }
export function sizeCss(id: string) { const s = READING_SIZES.find((x) => x.id === id) ?? READING_SIZES[1]; return { size: s.size, lh: s.lh }; }
```
- [ ] **Step 2: `lib/reading-prefs-actions.ts`**
```ts
// lib/reading-prefs-actions.ts
"use server";

import { eq } from "drizzle-orm";
import { getReader } from "@/lib/session";
import { isFontId, isSizeId } from "@/lib/reading-prefs";
import { db } from "@/db/client";
import { user } from "@/db/schema";

export async function setReadingPrefs(font: string, size: string): Promise<{ ok: boolean }> {
  if (!isFontId(font) || !isSizeId(size)) return { ok: false };
  const reader = await getReader();
  if (!reader) return { ok: false };
  await db.update(user).set({ readerFont: font, readerFontSize: size }).where(eq(user.id, reader.id));
  return { ok: true };
}
```
- [ ] **Step 3:** `npx tsc --noEmit` clean. Commit:
```
git add lib/reading-prefs.ts lib/reading-prefs-actions.ts
git commit -m "feat: reading prefs constants + setReadingPrefs action"
```

### Task 9: ReadingSettings component (sheet on mobile, popover on desktop)

**Files:** create `components/story/reading-settings.tsx`.

- [ ] **Step 1: Write the component.** It is controlled by the reader (receives current font/size + onChange). Renders a trigger "Aa" button; when open shows the settings. Use a bottom sheet styling on small screens and an anchored popover at `sm+` (a single markup with responsive classes is fine: fixed bottom sheet on mobile, absolute popover on `sm`). Close on Escape, scrim tap, or Done. Keyboard-focusable options.
```tsx
// components/story/reading-settings.tsx
"use client";

import { useEffect } from "react";
import { READING_FONTS, READING_SIZES, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

const SAMPLE_CLASS: Record<ReadingFontId, string> = {
  rounded: "font-[family-name:var(--font-nunito)]",
  hyperlegible: "font-[family-name:var(--font-atkinson)]",
  dyslexic: "[font-family:OpenDyslexic,sans-serif]",
};

export function ReadingSettings({
  open, onOpenChange, font, size, onFont, onSize,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  font: ReadingFontId;
  size: ReadingSizeId;
  onFont: (f: ReadingFontId) => void;
  onSize: (s: ReadingSizeId) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  const sizeScale = ["text-xs", "text-base", "text-xl", "text-2xl"];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(22,40,58,0.32)]" onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-label="Reading settings"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5 shadow-[0_-18px_40px_-20px_rgba(22,40,58,0.5)]
                   sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:w-72 sm:rounded-3xl sm:shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--pc-line)] sm:hidden" />
        <h4 className="font-display text-lg font-bold">Reading settings</h4>

        <p className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wider text-[var(--pc-sub)]">Text size</p>
        <div className="flex gap-2">
          {READING_SIZES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSize(s.id)}
              aria-pressed={size === s.id}
              className={`flex-1 rounded-xl border py-2.5 font-display font-bold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${sizeScale[i]} ${
                size === s.id ? "border-[var(--pc-plum)] bg-[var(--accent)] text-[var(--pc-plum-ink)]" : "border-[var(--pc-line)] text-[var(--pc-ink)]"
              }`}
            >
              A
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-extrabold uppercase tracking-wider text-[var(--pc-sub)]">Reading font</p>
        <div className="flex flex-col gap-2">
          {READING_FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFont(f.id)}
              aria-pressed={font === f.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                font === f.id ? "border-[var(--pc-plum)] bg-[var(--accent)]" : "border-[var(--pc-line)]"
              }`}
            >
              <span className="flex-1">
                <span className="block font-display text-sm font-bold">{f.label}</span>
                <span className="block text-xs text-[var(--pc-sub)]">{f.note}</span>
              </span>
              <span className={`text-lg text-[var(--pc-ink)] ${SAMPLE_CLASS[f.id]}`}>Bean</span>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-xs text-white ${font === f.id ? "bg-[var(--pc-plum)]" : "border-2 border-[var(--pc-line)]"}`}>
                {font === f.id ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="mt-5 w-full rounded-2xl bg-[var(--pc-plum)] py-3.5 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Done
        </button>
      </div>
    </>
  );
}
```
- [ ] **Step 2:** `npx tsc --noEmit` clean. Commit:
```
git add components/story/reading-settings.tsx
git commit -m "feat(ui): reading settings sheet/popover"
```

### Task 10: Reader restyle + integrate settings

**Files:** modify `components/story/story-reader.tsx`, `app/(app)/story/[slug]/page.tsx`.

- [ ] **Step 1:** In the story route, pass the reader's saved prefs to `StoryReader`. In `app/(app)/story/[slug]/page.tsx`, after `const reader = (await getReader())!;`, pass `initialFont={reader.readerFont as ReadingFontId}` and `initialSize={reader.readerFontSize as ReadingSizeId}` to `<StoryReader … />` (import the types from `@/lib/reading-prefs`).

- [ ] **Step 2: Rewrite `components/story/story-reader.tsx`** keeping ALL existing navigation/ending logic, adding: the Paper Cut styling, the `Aa` button + `ReadingSettings`, and applying font/size to the prose via inline CSS vars. New props `initialFont`, `initialSize`.
```tsx
// components/story/story-reader.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { StoryGraph } from "@/lib/stories/graph";
import { recordEnding } from "@/lib/stories/actions";
import { EndingScreen } from "@/components/story/ending-screen";
import { ReadingSettings } from "@/components/story/reading-settings";
import { setReadingPrefs } from "@/lib/reading-prefs-actions";
import { fontCss, sizeCss, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

export function StoryReader({
  slug, startKey, graph, initialFont, initialSize,
}: {
  slug: string; startKey: string; graph: StoryGraph;
  initialFont: ReadingFontId; initialSize: ReadingSizeId;
}) {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("p");
  const initialKey = urlKey && graph.pages[urlKey] ? urlKey : startKey;

  const [currentKey, setCurrentKey] = useState(initialKey);
  const [progress, setProgress] = useState<{ found: number; total: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [font, setFont] = useState<ReadingFontId>(initialFont);
  const [size, setSize] = useState<ReadingSizeId>(initialSize);

  const current = graph.pages[currentKey] ?? graph.pages[startKey];
  const { size: fSize, lh } = sizeCss(size);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("p", currentKey);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [currentKey, searchParams]);

  useEffect(() => {
    if (current.isEnding) recordEnding(slug, current.key).then((p) => { if (p) setProgress(p); });
  }, [current.isEnding, current.key, slug]);

  const persist = useCallback((f: ReadingFontId, s: ReadingSizeId) => { void setReadingPrefs(f, s); }, []);
  const chooseFont = (f: ReadingFontId) => { setFont(f); persist(f, size); };
  const chooseSize = (s: ReadingSizeId) => { setSize(s); persist(font, s); };

  const goTo = useCallback((key: string) => { setProgress(null); setCurrentKey(key); }, []);
  const readAgain = useCallback(() => goTo(startKey), [goTo, startKey]);

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-2 bg-[var(--pc-sky)]/80 px-4 py-2 backdrop-blur sm:top-16">
        <span className="flex-1" />
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Reading settings"
          className="grid h-9 w-11 place-items-center rounded-xl bg-[var(--pc-ink)] font-display font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          A<span className="text-[0.7em]">a</span>
        </button>
      </div>

      {current.isEnding ? (
        <EndingScreen endingLabel={current.endingLabel} progress={progress} onReadAgain={readAgain} />
      ) : (
        <article className="mx-auto max-w-[38rem]">
          <p className="reader-prose mb-8" style={{ ["--reading-font" as string]: fontCss(font), ["--reading-size" as string]: fSize, ["--reading-lh" as string]: lh }}>
            {current.body}
          </p>
          <div className="flex flex-col gap-3">
            {current.choices.map((c, i) => (
              <button
                key={`${c.to}-${i}`}
                onClick={() => goTo(c.to)}
                className={`flex items-center gap-3 rounded-2xl p-4 text-left font-display text-base font-bold text-white shadow-[0_5px_0_rgba(0,0,0,0.14)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  i % 2 === 0 ? "bg-[var(--pc-leaf-ink)]" : "bg-[var(--pc-poppy-ink)]"
                }`}
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-xl bg-white/25 text-lg">{i % 2 === 0 ? "🌿" : "🏠"}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </article>
      )}

      <ReadingSettings
        open={settingsOpen} onOpenChange={setSettingsOpen}
        font={font} size={size} onFont={chooseFont} onSize={chooseSize}
      />
    </div>
  );
}
```
Note: the choice icons here are generic (leaf/home) since choice labels already carry their own emoji; keep the label text as-authored and drop the extra icon chip if it doubles up — implementer's judgment to match the mock (the mock shows one icon chip + label). If labels already include an emoji, render just the label without the chip.

- [ ] **Step 3:** Verify the full reading flow in the browser: prose renders in Paper Cut; the Aa button opens settings; changing size/font updates the prose live; reload keeps the choice (persisted). Commit:
```
git add components/story/story-reader.tsx "app/(app)/story"
git commit -m "feat(ui): Paper Cut reader with accessibility controls"
```

---

## Phase 4 — Sign-in + Ending

### Task 11: Sign-in restyle

**Files:** modify `app/sign-in/page.tsx` (keep all logic; restyle only).

- [ ] **Step 1:** Restyle the sign-in card to Paper Cut: sky background, a white rounded-3xl card with soft shadow, a brand mark + "Storytime" in Baloo, Nunito labels, plum primary button with the paper bottom-edge shadow, styled error text (`text-[var(--pc-poppy-ink)]`). Preserve the `signInAction` call, state, and field ids/names. Full-screen centered, `min-h-screen`, padding for mobile.
- [ ] **Step 2:** Verify sign-in still works (milo/storytime) and looks Paper Cut. Commit:
```
git add app/sign-in/page.tsx
git commit -m "feat(ui): Paper Cut sign-in"
```

### Task 12: Ending screen restyle

**Files:** modify `components/story/ending-screen.tsx`.

- [ ] **Step 1: Rewrite `components/story/ending-screen.tsx`** — celebratory Paper Cut: a sun badge with 🎉, "The End" eyebrow, ending name in Baloo, a white progress chip ("You've found **X of Y** endings!"), a row of endings-found dots (filled leaf = found, based on `progress.found`/`progress.total`), primary "Read it again" (plum) calling `onReadAgain`, secondary "Back to the library" link to `/`. Paper-confetti bits absolutely positioned, animating in via a keyframe that is disabled under reduced-motion (the global reduced-motion rule already neutralizes it). Keep the prop signature `{ endingLabel, progress, onReadAgain }`.
```tsx
// components/story/ending-screen.tsx
"use client";

import Link from "next/link";

const CONFETTI = [
  { c: "var(--pc-poppy)", l: "12%", t: "10%", r: "18deg" },
  { c: "var(--pc-leaf)", l: "82%", t: "8%", r: "-24deg" },
  { c: "var(--pc-sun)", l: "24%", t: "20%", r: "40deg" },
  { c: "var(--pc-plum)", l: "70%", t: "22%", r: "12deg" },
  { c: "var(--pc-sun)", l: "8%", t: "42%", r: "28deg" },
  { c: "var(--pc-leaf)", l: "90%", t: "40%", r: "-10deg" },
];

export function EndingScreen({
  endingLabel, progress, onReadAgain,
}: {
  endingLabel: string | null;
  progress: { found: number; total: number } | null;
  onReadAgain: () => void;
}) {
  const total = progress?.total ?? 0;
  const found = progress?.found ?? 0;

  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center overflow-hidden py-10 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {CONFETTI.map((p, i) => (
          <span key={i} className="absolute h-3.5 w-2.5 rounded-[2px]" style={{ background: p.c, left: p.l, top: p.t, transform: `rotate(${p.r})` }} />
        ))}
      </div>
      <div className="mb-5 grid h-20 w-20 -rotate-6 place-items-center rounded-3xl text-4xl shadow-[0_12px_24px_-10px_rgba(255,150,20,0.6)]" style={{ background: "var(--pc-sun)" }}>🎉</div>
      <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--pc-sub)]">The End</p>
      {endingLabel && <h2 className="mb-3 font-display text-2xl font-extrabold sm:text-3xl">{endingLabel}</h2>}
      {progress && (
        <>
          <div className="rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 text-sm font-bold shadow-[0_8px_20px_-14px_rgba(22,40,58,0.4)]">
            You&apos;ve found <b className="text-[var(--pc-poppy-ink)]">{found} of {total}</b> endings!
          </div>
          <div className="my-4 flex justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className="h-3 w-3 rounded-full" style={{ background: i < found ? "var(--pc-leaf)" : "var(--pc-line)" }} />
            ))}
          </div>
        </>
      )}
      <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
        <button onClick={onReadAgain} className="rounded-2xl bg-[var(--pc-plum)] py-3.5 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Read it again</button>
        <Link href="/" className="rounded-2xl border border-[var(--pc-line)] bg-white py-3 text-center font-display font-bold text-[var(--pc-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">Back to the library</Link>
      </div>
    </div>
  );
}
```
- [ ] **Step 2:** Verify an ending shows confetti + dots + progress in the browser. Commit:
```
git add components/story/ending-screen.tsx
git commit -m "feat(ui): celebratory Paper Cut ending screen"
```

---

## Phase 5 — Responsive & accessibility verification

### Task 13: Verification pass (no new features; fix what's found)

- [ ] **Step 1:** `npm run build` and `npm run test` both green.
- [ ] **Step 2:** In the browser (preview), verify at mobile (375px) and desktop (1280px):
  - Library grid 1→2→3 columns; no horizontal page scroll at any width.
  - Reader column comfortable; Aa is a bottom sheet on mobile, popover on desktop; changing size/font updates prose and persists across reload.
  - Header avatar menu opens/closes; Sign out works.
  - Ending screen renders confetti + correct dots.
- [ ] **Step 3:** Accessibility checks: every interactive element has a visible focus ring; tap targets ≥ 44px; the Aa control is fully keyboard-operable and closes on Escape; verify text-on-color contrast — choice buttons (white on `--pc-leaf-ink` / `--pc-poppy-ink`), primary button (white on `--pc-plum`), and `--pc-sub` body text all meet ≥ 4.5:1 (adjust the `-ink` shades darker if any fail).
- [ ] **Step 4:** Fix any issues found, commit per fix. Final commit when clean:
```
git commit -am "fix(ui): responsive + a11y polish for Paper Cut"
```

---

## Self-Review Notes

- Spec coverage: fonts (Task 1) · single identity/tokens (Tasks 2–3) · StoryCover (4) · header (5) · library responsive (6) · reader prefs data (7–8) · Aa control (9) · reader restyle + application (10) · sign-in (11) · ending (12) · responsive/a11y (13).
- `"use server"` split respected: constants in `lib/reading-prefs.ts`, action in `lib/reading-prefs-actions.ts`.
- No invented data: library card meta reads "Tap to read" because `StoryCard` has no page/ending counts; adding counts is a separate future change, not assumed here.
- Base UI Button has no `asChild`; all styled links use plain `<Link>` + classes (not `<Button asChild>`).
- Reduced-motion honored globally; focus rings via `focus-visible:ring-[var(--ring)]`.
- Contrast: text-bearing fills use `-ink` shades; Task 13 Step 3 verifies ≥ 4.5:1 and darkens if needed.
