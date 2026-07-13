# Bedtime Quests — native app (`@bedtime-quests/mobile`)

Expo (SDK 57) / React Native port of the Bedtime Quests UI (issue #54). Every
rule and computation is reused from `@bedtime-quests/core`; this package only
builds the native screens and a local data layer around it.

## Running it

```
cd apps/mobile
npm run start        # Expo dev server (open in Expo Go or a simulator)
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run typecheck    # tsc --noEmit
```

The full flow works with no backend: **sign in → pick a reader → read a story to
an ending → see the ending screen**, with the child's name personalized, plus the
paywall and the achievements/collection view.

## Architecture

- **Design foundation** — `src/theme` holds the Paper Cut color tokens,
  spacing/radii, and typography, ported literally from the web `globals.css`.
- **Shared primitives** (`src/ui`) encode the app-wide UI rules once and are
  reused everywhere:
  - `PaperButton` / `PressableCard` — the chunky solid bottom edge + press
    compression that makes a control read as tappable on touch (UI rule 2). The
    tap cue lives in the resting state (no hover on touch).
  - `Card` — the same surface with **no** bottom edge, for non-interactive panels.
  - `Screen` — safe-area container (iOS insets via `SafeAreaView`, Android status
    bar height added), works on both phone sizes.
  - `Pill` — Free / Premium / age badges.
- **Navigation** (`src/navigation`) — a small typed stack on React state. Auth and
  the child picker are gate states derived from session + active reader; Library,
  Reader, Paywall, and Achievements are stack routes. Mirrors the web flow.
- **Data layer** (`src/data`) — the UI is written against interfaces in
  `types.ts`, satisfied today by an in-memory store (`store.tsx`) that drives all
  gameplay/gating through core (`graphFromStoryInput`, `computeStoryProgress`,
  `buildCollection`, `isStoryUnlocked`, `personalize`, `NOT_SUBSCRIBED`).
- **Content** (`src/content`) — the app bundles the same authored story files the
  web app seeds its database from (one source of truth), resolved by Metro via the
  workspace `watchFolders` in `metro.config.js`.
- **Covers** (`src/components/StoryCover.tsx`) — a native equivalent of the web
  SVG covers, built from plain Views (no SVG dependency), same six motifs/palette.

### One core addition

`graphFromStoryInput` was added to `@bedtime-quests/core` (`stories/from-input.ts`)
— a pure, platform-agnostic adapter turning an authored `StoryInput` into the
runtime `StoryGraph` the reader consumes, so the native app drives the exact same
reader with no database. Covered by `from-input.test.ts`.

## Intentionally deferred (not this issue)

- **Native billing (#55)** — "Start your free trial" passes the parental gate,
  shows the plan picker, then lands on the honest "starts in the app" screen.
  Nothing is charged and no entitlement is faked, mirroring the web app.
- **Push (#56)** and **native offline (#66)** — separate issues.
- **Real font loading** — this build maps Baloo 2 / Nunito / the reading fonts onto
  the system font (dependency-light). Seam documented in `src/theme/typography.ts`
  (`useFonts` + `@expo-google-fonts/*`).
- **Real auth + persistence** — auth is a local stub and progress is in-memory for
  the session. Seams are in `src/data/store.tsx`.

## Backend endpoints the native app still needs

The web backend is Next.js server components + server actions with **no callable
REST API** for app data (only the BetterAuth routes under `/api/auth/**` exist).
Before the app can talk to the real backend, the server needs these (each maps to
an existing server-side function; nothing here is a workaround, per the issue):

| Need | Today (web, server-only) | Endpoint to add |
| --- | --- | --- |
| Session for a native client | cookie session | Bearer-token session read (`GET /api/auth/session`) + `@better-auth/expo` |
| List catalog | `getCatalog(ageBand)` | `GET /api/stories` |
| Story graph | `loadStoryGraph(storyId)` | `GET /api/stories/:slug` |
| Record ending | `recordEnding(slug, key)` action | `POST /api/stories/:slug/record-ending` |
| List / create / update / remove reader | `children-actions.ts` | `GET/POST/PUT/DELETE /api/children` |
| Set active reader | `setActiveChild` action | `POST /api/children/:id/activate` |
| Reading prefs | `setChildReadingPrefs` action | `PUT /api/children/:id/reading-prefs` |
| Collection | `getCollection(childId)` | `GET /api/children/:id/collection` |
| Current entitlement | session + RevenueCat webhook | `GET /api/entitlements/current` |

Config is via Expo public env / `app.json` (e.g. the API base URL). No secrets are
embedded in the app, and `.env.local` is never read or committed.
