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

## Deep & universal / app links (#65) — implemented

Links open the app on the right screen. A custom scheme (`bedtimequests://`)
handles internal deep links, and verified Universal Links (iOS) / App Links
(Android) let a `https://bedtimequests.com/...` URL open the app. Routing goes
through the SAME navigation as everything else: `src/linking/` is a provider seam
(`LinkingProvider` interface + real React Native `Linking` provider + mock +
factory + context, mirroring billing/notifications), the context turns an incoming
URL into a `DeepLinkTarget` via the pure `parseDeepLink` in `@bedtime-quests/core`,
and `Navigator.tsx` maps that target onto its screen stack. The bedtime-reminder
tap (#56) now reuses the same library target.

URL to screen map (full table + how to verify end to end in
[`docs/DEEP-LINKS.md`](../../docs/DEEP-LINKS.md)):

| Link | Screen |
| --- | --- |
| `bedtimequests://` / `://library` / `://home` | Library |
| `https://bedtimequests.com/story/<slug>` / `bedtimequests://story/<slug>` | Reader for that story |
| `https://bedtimequests.com/collection` / `bedtimequests://collection` | Collection / Achievements |
| unknown or malformed | Library (never crashes) |

Native config lives in `app.json`: `scheme` (custom scheme, from #58),
`ios.associatedDomains` (`applinks:bedtimequests.com`), and `android.intentFilters`
with `autoVerify` for the `/story` and `/collection` path prefixes. These only take
effect in a real build (prebuild / EAS), not Expo Go. A cold-start link is honored
after the auth + reader gates; a link while running routes immediately. Simulate a
cold-start link locally with `EXPO_PUBLIC_LINK_INITIAL_URL`. **Universal/App link
verification needs the deployed association files (served by the root web app at
`/.well-known/*`) plus the real Apple Team ID and Android signing SHA-256** — set
those and confirm on a device per `docs/DEEP-LINKS.md`.

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

## Offline handling (#66) — implemented

Bedtime reading survives a dropped connection. Three seams, mirroring billing /
notifications / linking, plus a small pure model in
[`@bedtime-quests/core/offline`](../../packages/core/src/offline.ts):

- **Connectivity** (`src/connectivity/`) — a `ConnectivityProvider` interface, a real
  provider backed by `@react-native-community/netinfo` (dev build), an in-memory mock
  (Expo Go / CI / this repo), a factory, and a context. Any screen reads the shared
  state with `useConnectivity()` (`{ connectivity, isOffline, ready, providerName }`).
- **Read-through cache** (`src/cache/`) — a `KeyValueStore` seam (real
  `@react-native-async-storage/async-storage` or an in-memory map) under an
  `OfflineCache` that persists the last-seen catalog, a snapshot of the active reader,
  and **each story the child opens** (bounded LRU, cap 12, so it never grows without
  limit). Eviction, the online/offline read decision, and the write outbox are decided
  by the pure, unit-tested core module.
- **Offline UX** — a calm Paper Cut `<OfflineNotice>` renders inside `<Screen>` on
  every screen (nothing when online), the reader's missing-story state speaks plainly
  when offline, and finishing a story offline shows a warm "saved on this device"
  note. All copy is high-contrast and dash-free (UI rules 1/3) and lives in core.
- **Writes while offline** — recording an ending is **local-first**: it is saved
  on-device immediately so a bedtime session is never blocked, and when offline it is
  also queued in a durable outbox to replay on reconnect. There is no app-data backend
  yet (see the endpoint table below), so the reconnect sync is a documented no-op that
  keeps the queue intact rather than fabricating a call; when the REST API lands it
  POSTs each queued write. Reading never depends on connectivity.

Scope for v1 is the read-through cache of opened stories plus the last catalog
(revisit or finish a story offline); proactively prefetching the whole library and
OTA content refresh (#67) are out of scope here. The launch library is bundled today
(`src/content`), so every story already reads offline; this is the machinery that
keeps that true once content moves behind the API.

**Simulate offline** without airplane mode by setting `EXPO_PUBLIC_FORCE_OFFLINE=1`
(the context forces offline on top of any provider), then open a story and reach an
ending. On a dev build, real NetInfo + AsyncStorage come from
`npm run prepare:device-build` (kept off master's lockfile, like the other native
modules); toggle airplane mode to see the same states.

## Over the air updates (#67) — implemented

The app ships JS, most assets, and new **story content** to installed apps without a
store build, via EAS Update (`expo-updates`). Same seam pattern as billing /
notifications / linking / connectivity: an `UpdatesProvider` interface (`src/updates/`)
with a real `expo-updates` provider, an in memory mock (Expo Go / CI / this repo), a
factory, and a context that owns the strategy.

Strategy (`src/updates/context.tsx`): **check on cold launch, download in the
background, apply on the next cold start.** It never reloads mid session, so a bedtime
read is never interrupted. An optional, on brand `<UpdateReadyNotice>` shows on the
**Library** only when an update is pending, with dash free high contrast copy and an
optional "add them now" button; if it is never tapped, the update still applies
silently next cold start.

Config lives in `app.json`: `runtimeVersion` uses the **`fingerprint`** policy so an
OTA update only reaches a compatible binary (any native change bumps the fingerprint
and forces a new build instead), `updates.url` + `extra.eas.projectId` carry a
`REPLACE_WITH_EAS_PROJECT_ID` placeholder that `eas update:configure` fills in, and
`checkAutomatically: ON_ERROR_RECOVERY` lets the app own the launch check. Channels
(`eas.json` build profiles) map to stages: `development` / `preview` / `production`.

Like real IAP and push, OTA needs the native module in the binary, so an OTA capable
build first runs `npm run prepare:device-build` (now includes `expo-updates`, kept off
master's lockfile). **Simulate the notice** in Expo Go with
`EXPO_PUBLIC_FORCE_UPDATE_READY=1`. Full channel setup, the publish / promote /
rollback commands, how to verify an update reached devices, and the OTA vs new build
boundary are in [`docs/OTA-UPDATES.md`](../../docs/OTA-UPDATES.md); the monthly story
publish tie in is in [`docs/STORY-CADENCE.md`](../../docs/STORY-CADENCE.md).

## Rate and review (#71) — implemented

The app asks satisfied families to rate/review at a well timed, non disruptive moment
using the OS native review prompt (`expo-store-review`). Same seam pattern as the rest:
a `StoreReviewProvider` interface (`src/review/`) with a real `expo-store-review`
provider, an in memory mock (Expo Go / CI / this repo), a factory, and a context.

**When it asks.** The "should we ask now?" decision is a pure, unit tested function in
core (`packages/core/src/review-prompt.ts`, `shouldRequestReview`). It fires only as a
family **leaves a GOOD ending** (back to the library or on to their endings), never on
launch, never mid story, and **never on a game over** (a frustration moment). It also
requires a real track record first (default: at least 3 good endings found **or** 2
whole stories completed).

**Frequency caps.** The context persists a tiny state (times asked + when) via the same
key/value seam as the offline cache, and caps it: a long **cooldown** between asks
(default 120 days) and a small **lifetime cap** (default 3). We only ever call the OS
prompt (`StoreReview.requestReview`); the **OS itself decides whether to show it and
rate limits it**, so our caps are a conservative extra layer, not a fight with the OS.
If the prompt is unavailable here (web, TestFlight, module absent) we do **not** burn a
cap. No feature is gated on a review and no incentive is offered (both stores forbid it);
ignoring the prompt has zero downside.

**Manual fallback.** Settings has a **Rate Bedtime Quests** entry that always opens the
store review/listing page directly (`StoreReview.storeUrl()` with a platform fallback:
Play from the package id, App Store from `EXPO_PUBLIC_APP_STORE_ID`), so a willing parent
can review any time even after the native prompt is used or unavailable.

Like the other native modules, `expo-store-review` is loaded via runtime `require` and is
kept off master's lockfile; an on device build first runs `npm run prepare:device-build`
(now includes it). **Simulate the unavailable path** with
`EXPO_PUBLIC_STORE_REVIEW_MOCK_AVAILABLE=false`. Note: the real OS dialog is rate limited
and often will not appear in a simulator or dev build even when requested.

## Intentionally deferred (not this issue)

- **Remote push (#56 second half)** — the local bedtime reminder shipped; remote push
  is deferred (see `docs/NOTIFICATIONS.md`).
- **Real font loading** — this build maps Baloo 2 / Nunito / the reading fonts onto
  the system font (dependency-light). Seam documented in `src/theme/typography.ts`
  (`useFonts` + `@expo-google-fonts/*`).
- **Real auth + persistence** — auth is a local stub and progress is in-memory for
  the session. Seams are in `src/data/store.tsx`.

## First-time parent tutorial (#73) — web shipped, native is a scoped follow-up

The first-time parent tutorial shipped on **web** in issue #73. The reusable half
already lives in the shared core and is ready for the native app to consume, so
the two surfaces will not drift:

- **Copy + gating are in core** — `@bedtime-quests/core/onboarding` exports the
  walkthrough steps (`ONBOARDING_STEPS`, one warm dash-free card per topic), the
  button/heading strings (`ONBOARDING_COPY`), and the pure gating decision
  (`shouldAutoShowOnboarding({ onboardingCompletedAt, hasChildren })`). The Expo
  app already imports from this same package, so the native tour must render these
  exact steps rather than re-authoring copy.

**What the native follow-up needs to build:**

1. **A native walkthrough UI** — a lightweight, swipeable card sequence (a few
   `View`-based cards, no tour dependency) that renders `ONBOARDING_STEPS` and is
   skippable at any point, mirroring `components/onboarding/parent-onboarding.tsx`
   on web. Map each step's `icon` key to a native glyph.
2. **A completion flag read/write** — web stores it per parent account in the
   `parent_onboarding` table. Native has no REST layer yet, so this depends on the
   children/session endpoints in the table below; add a
   `GET/POST /api/onboarding` (read the completion timestamp / stamp it) alongside
   them, or fold it into the session payload. Until then, the local store
   (`src/data/store.tsx`) can hold a per-device flag as the interim secondary,
   matching the web local fallback (`lib/onboarding-local.ts`).
3. **Trigger + re-open** — auto-show once via `shouldAutoShowOnboarding` when a new
   parent has no children yet; add a "Show me around" entry in
   `src/screens/SettingsScreen.tsx` to replay it (the same `ONBOARDING_COPY.reopen`
   label web uses).

Nothing here re-authors content: it is UI + one endpoint on top of the shared core.

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
| Tutorial completion (#73) | `getOnboardingCompletedAt` / `completeOnboarding` | `GET/POST /api/onboarding` |
| Register push token (deferred, #56) | none yet | `POST/DELETE /api/notifications/token` (spec in `docs/NOTIFICATIONS.md`) |

Config is via Expo public env / `app.json` (e.g. the API base URL). No secrets are
embedded in the app, and `.env.local` is never read or committed.
