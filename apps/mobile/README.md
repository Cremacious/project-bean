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
  `buildCollection`, `isStoryUnlocked`, `personalize`, `NOT_SUBSCRIBED`). The store
  also owns billing: it holds one `BillingProvider`, attaches the parent on sign in
  (`Purchases.logIn`), and exposes `purchase` / `restorePurchases` /
  `refreshEntitlement`, updating the shared `entitlement` on success.
- **Billing** (`src/billing`) — the RevenueCat integration (issue #55). The paywall
  depends on the `BillingProvider` interface, satisfied by the real RevenueCat
  provider in a dev build with store products, or an in-memory mock everywhere
  else. Entitlement is mapped into the same core `Subscription` via
  `subscriptionFromRevenueCat`, so a purchase gates exactly like web. See
  `docs/BILLING-REVENUECAT.md` for the RevenueCat / App Store / Play setup.
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

## Native billing (#55) — implemented

"Start your free trial" passes the parental gate (#32), shows the plan picker with
live store offerings (monthly / yearly, 7 day trial, yearly savings), and runs a
real purchase / restore through RevenueCat. Success unlocks premium immediately;
cancelled, pending (Ask to Buy), and error each land on warm, dash-free copy. With
no store products configured the mock provider drives the whole flow so it is fully
exercisable today. Store/RevenueCat setup and the deferred (live-store) checks are
in `docs/BILLING-REVENUECAT.md`. IAP needs a dev build, not Expo Go.

## Bedtime reminder (#56) — implemented (local)

A gentle, optional nightly "storytime" reminder for the PARENT, scheduled on-device
with `expo-notifications`. It is OFF until the parent turns it on from **Settings**
(reached through the parental gate), which explains what it is for BEFORE the OS
prompt, lets them pick the time, reflects the OS permission state, and offers a path
to the OS settings if permission was declined. A tap deep-links to the library. No
server and no personal data: the reminder copy carries no child name or profile
(docs/COMPLIANCE-COPPA.md sections 2 and 6). Remote push is deferred (the native app
has no real parent session yet to attach a token to); the seam and the backend
endpoint spec are in `docs/NOTIFICATIONS.md`. Local notifications work in Expo Go on
SDK 57 once the module is installed; this repo runs the in-memory mock so the whole
flow is exercisable with no native module.

## App icons & splash (#57) — implemented

The native icon and launch splash use the **same paper-boat brand art** as the web
favicon, apple-icon, and store icons, so nothing drifts. All of it is emitted by the
shared generator `scripts/gen-icons.ts` from the single `INNER` art definition — do
**not** hand-edit the files in `assets/`. To change the mark, edit `INNER` (and keep
`components/brand-mark.tsx` in sync), then from the repo root run:

```
npm run gen:icons
```

That (re)writes the web assets **and** these native ones in `apps/mobile/assets/`:

| File | Used by | Format |
| --- | --- | --- |
| `icon.png` | iOS + top-level + legacy Android icon | 1024×1024 full-bleed square, **no alpha** (Apple rejects transparency) |
| `android-icon-foreground.png` | Android adaptive foreground | 1024×1024 transparent, art scaled to the central safe zone |
| `android-icon-background.png` | Android adaptive background | 1024×1024 solid navy `#16283A`, no alpha |
| `android-icon-monochrome.png` | Android 13+ themed icon | 1024×1024 white silhouette on transparency |
| `splash-icon.png` | `expo-splash-screen` mark | 1024×1024 transparent; the navy moon-carve blends into the navy splash |
| `favicon.png` | Expo web favicon | 48×48 rounded |

Wiring lives in `app.json`: the top-level `icon`, `android.adaptiveIcon` (navy
`backgroundColor` + the three layers), and the `expo-splash-screen` plugin
(`resizeMode: contain`, `backgroundColor: #16283A`, matching dark variant, no text).
The adaptive foreground and monochrome art is inset to Android's ~66% safe zone so
the launcher's circle/squircle mask never clips the boat. The splash and icon render
natively at **prebuild / EAS build** time (not in Expo Go's default splash); verify
on a dev build or `npx expo prebuild`.

## Store identifiers & submission (#58)

The app's **final, permanent** store identifiers are locked in `app.json`:

| Identifier | Value |
| --- | --- |
| iOS bundle identifier | `com.bedtimequests.app` |
| Android package name | `com.bedtimequests.app` |
| App display name | `Bedtime Quests` |
| Expo slug | `bedtime-quests` |
| Deep-link scheme | `bedtimequests://` |

Build/submit is via **EAS** (`eas.json`): `development` / `preview` / `production` build
profiles and `internal` / `production` submit profiles (iOS → TestFlight / App Store,
Android → internal / production track). No signing keys or service-account JSON live in the
repo — iOS/ASC credentials are EAS-managed and the Play service-account key goes in the
gitignored `credentials/` folder. Account enrollment (Apple Developer Program, Google Play
Console), the IDs you must reuse, and the `eas init` / `eas submit` steps that are blocked
until the accounts exist are all in [`docs/STORE-ACCOUNTS.md`](../../docs/STORE-ACCOUNTS.md).

## TestFlight & Play internal testing (#59)

The full build-and-distribute pipeline is in
[`docs/TESTFLIGHT-PLAY-TESTING.md`](../../docs/TESTFLIGHT-PLAY-TESTING.md): build with the
`production` profile, submit with the `internal` profile (iOS → TestFlight, Android →
internal track), set up testers, and run the on-device checklist. Key gotcha: a store build
of the repo **as-is** ships the mock billing/notifications providers. To verify **real** IAP
(#55) and push (#56) on device, first install the native modules with
`npm run prepare:device-build` (a local, throwaway step — do **not** commit the lockfile
change to `master`; it drops the web CI's wasm/@emnapi entries). The public RevenueCat keys
reach EAS cloud builds via EAS environment variables (each build profile is bound to its
`environment`), never via committed secrets.

## Intentionally deferred (not this issue)

- **Remote push (#56 second half)** and **native offline (#66)** — the local
  bedtime reminder shipped; remote push is deferred (see `docs/NOTIFICATIONS.md`).
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
| Current entitlement | session + RevenueCat webhook | `GET /api/entitlements/current` (added in #55) |
| Register push token (deferred, #56) | none yet | `POST/DELETE /api/notifications/token` (spec in `docs/NOTIFICATIONS.md`) |

Config is via Expo public env / `app.json` (e.g. the API base URL). No secrets are
embedded in the app, and `.env.local` is never read or committed.
