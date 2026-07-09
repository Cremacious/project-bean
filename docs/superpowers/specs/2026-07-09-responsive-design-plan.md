# Responsive design plan — fill the viewport, no dead space

Issue: [Cremacious/project-bean#4](https://github.com/Cremacious/project-bean/issues/4).
Status: **proposed** (awaiting sign-off), then applied app-wide.

## Goal

1. The app looks good at every width: mobile (375px), tablet (768px), desktop (1280px+).
2. The UI fills the page to the bottom of the screen at all times. No large band of empty
   sky under short pages.

These conventions are non-negotiable going forward and stack on the three app-wide UI rules
in `docs/WORKFLOW.md` (no dashes in copy, every clickable looks clickable, all text
high-contrast).

## Audit of today's layout (what breaks)

**Shared root cause.** Both app shells (`app/(app)/layout.tsx`, `app/admin/layout.tsx`) are a
`min-h-screen` div holding a sticky header and a `<main>` with padding. `<main>` is a normal
block, not a growing flex child, so page content clumps directly under the header and every
pixel below the content is empty background. There is no footer to cap the bottom.

| Screen | Behavior today | Problem |
| --- | --- | --- |
| Sign in / Sign up | `flex min-h-screen items-center justify-center` | Already fills + centers. Only nit: `min-h-screen` should be `min-h-dvh`. |
| Child picker (first + choose) | `section py-8`, top aligned | One card / a few avatars sit at top; large void below at tablet/desktop. |
| Library | `section space-y-6`, top aligned | With 0 to 3 stories, most of a 1280px screen is empty sky under the grid. |
| Collection | top aligned, empty states | Empty "Your stories" / few badges leave a tall void. |
| Family | `max-w-2xl` top aligned | One child + add form leaves desktop dead space. |
| Story reader | `max-w-2xl` top aligned | A short page (little text + 2 choices) leaves a big empty area below. Reader sub-bar `top-14 sm:top-16` must match real header height. |
| Admin home / editor | `max-w-4xl` top aligned | Few stories leave dead space. Buttons use `active:translate-y-px` instead of the canonical `active:translate-y-0.5`. |

**Inconsistencies to rationalize.** Container widths are ad hoc: app `max-w-5xl`, admin
`max-w-4xl`, family/picker/story `max-w-2xl`, auth `max-w-sm`, ending `max-w-md`. `min-h-screen`
is used instead of `min-h-dvh` (100vh overshoots the visible viewport on mobile browsers with a
dynamic toolbar). No footer exists anywhere.

## Breakpoints

Use Tailwind's defaults; design mobile-first and add `sm:`/`lg:` as needed.

| Token | Min width | Primary use |
| --- | --- | --- |
| (base) | 0 | Mobile, single column. |
| `sm` | 640px | Larger phones / small tablets: 2-column grids, bigger type. |
| `md` | 768px | Tablet. |
| `lg` | 1024px | Desktop: 3-column grids. |
| `xl` | 1280px | Wide desktop (no new layout, just more gutter). |

Test targets: **375px, 768px, 1280px**.

## Container width scale (named roles)

One documented scale, reused by role. Always paired with `mx-auto w-full` and page gutters
`px-4 sm:px-6`.

| Role | Class | Screens |
| --- | --- | --- |
| Auth card | `max-w-sm` | Sign in, sign up. |
| Focused / reading | `max-w-2xl` | Story reader, ending screen, child forms, family, child picker. |
| App content | `max-w-5xl` | Library, collection (multi-column grids). |
| Admin | `max-w-4xl` | Admin shell. |

## Spacing scale

| Purpose | Utility |
| --- | --- |
| Page gutter (horizontal) | `px-4 sm:px-6` |
| Shell vertical padding | `py-6` |
| Between major blocks | `space-y-6` (24px) or `gap-6` |
| Within a group (list rows, form fields) | `space-y-3` / `gap-3` |
| Card padding | `p-5 sm:p-6` |
| Grid gaps | `gap-3` (tight tiles) to `gap-4` (cards) |

## The fill-the-viewport strategy

A **`min-h-dvh` flex column app shell**: sticky header at the top, a `<main>` that **grows** to
absorb all slack, and a footer pinned to the bottom. Because the shell is always exactly viewport
height (minimum), the colored background and footer always reach the bottom of the screen. Because
`<main>` grows, a page's content region can stretch to fill instead of clumping under the header.

### 1. Shell (app + admin)

```tsx
<div className="flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]">
  <AppHeader … />                                {/* sticky top-0 z-30, flex-none */}
  <main className="flex flex-1 flex-col">
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      {children}
    </div>
  </main>
  <SiteFooter />                                 {/* flex-none */}
</div>
```

- `min-h-dvh` (not `min-h-screen`): exact visible viewport on mobile.
- `main` is `flex flex-1 flex-col` and its inner container is also `flex-1 flex flex-col`, so
  children receive a **full-height flex column** to live in.

### 2. Page contract

Every page's root element is a growing flex column:

```tsx
<section className="flex flex-1 flex-col gap-6">…</section>
```

The one region that should absorb slack gets `flex-1`:

- **Rich content (Library, Collection, Admin list):** wrap the grid/list *and its empty state*
  in `<div className="flex-1">`. Content stays top-anchored inside it; the region stretches to the
  footer so there is no clump-then-void.
- **Empty state:** the "no stories yet" message uses `grid flex-1 place-items-center text-center`
  so it centers in the available space instead of hugging the top.
- **Short single-column flows (Family, Child picker, Story reader):** the section itself is
  `flex flex-1 flex-col`; center the content block vertically with `justify-center` when it is
  shorter than the viewport (`className="flex flex-1 flex-col justify-center gap-6"`), so a lone
  form or a short story page sits in the optical center rather than jammed at the top.

### 3. Footer

A small, always-present `SiteFooter` (`flex-none`) guarantees the bottom of the screen is UI, not
void. High-contrast, no dashes, links carry the focus ring. Kept short (one line: product mark +
a couple of links) so it never dominates.

### 4. Sticky offsets

Header is a fixed height (`h-14 sm:h-16` on the inner bar) so the reader's sticky sub-bar
(`top-14 sm:top-16`) lines up exactly. Header stays `sticky top-0 z-30`; the reader sub-bar is
`z-20` beneath it.

### 5. Auth pages (outside the shell)

Already correct: `flex min-h-dvh items-center justify-center p-4`. Switch `screen` to `dvh`. These
own their centering and do not use the shell footer.

## Reusable patterns to copy verbatim

```
Shell root:        flex min-h-dvh flex-col bg-[var(--pc-sky)] text-[var(--pc-ink)]
Shell main:        flex flex-1 flex-col
Shell container:   mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6
Page root:         flex flex-1 flex-col gap-6
Short page root:   flex flex-1 flex-col justify-center gap-6
Fill region:       flex-1
Empty state:       grid flex-1 place-items-center text-center
Header inner bar:  mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:h-16 sm:px-6
Auth root:         flex min-h-dvh items-center justify-center p-4
Chunky button:     … shadow-[0_5px_0_<ink>] active:translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)]
```

## Application checklist

- [ ] `app/(app)/layout.tsx` — flex-column shell + footer, `min-h-dvh`.
- [ ] `app/admin/layout.tsx` — same shell + footer, `max-w-4xl`.
- [ ] `components/app-header.tsx` — fixed header height, normalize the "Switch" control affordance.
- [ ] `components/site-footer.tsx` — new shared footer.
- [ ] `components/library.tsx` — page contract + `flex-1` grid region + centered empty state.
- [ ] `components/gameplay/collection-view.tsx` — page contract + `flex-1` region.
- [ ] `app/(app)/family/page.tsx` — short-page contract.
- [ ] `components/profiles/child-picker.tsx` — short-page contract (both branches).
- [ ] `app/(app)/story/[slug]/page.tsx` + `components/story/story-reader.tsx` — short-page contract, sticky offset.
- [ ] `components/story/ending-screen.tsx` — center within the grown region.
- [ ] `app/admin/page.tsx` + `app/admin/stories/[slug]/page.tsx` — page contract, `translate-y-0.5`.
- [ ] `app/sign-in/page.tsx`, `app/sign-up/page.tsx` — `min-h-dvh`.

Verify each at 375px, 768px, 1280px: no horizontal scroll, no void under short content, footer
pinned to the bottom, all clickables show the chunky affordance + focus ring.
