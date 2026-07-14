# Push notifications with consent (issue #56)

How Bedtime Quests sends a gentle, parent-controlled bedtime reminder in the native
app, and what a device build needs to schedule real notifications. The code is
complete and runs today on an in-memory mock; the steps below are the device-build
setup.

## What shipped, and what was deferred

**Shipped: a LOCAL, on-device bedtime reminder.** An optional nightly reminder
aimed at the PARENT ("Storytime is waiting"), scheduled on-device with
`expo-notifications`. It needs no server, no account, and no personal data. This is
the privacy-friendly default the issue preferred, and it fully satisfies the primary
use: a gentle reminder so storytime does not slip by.

**Deferred: REMOTE push.** We deliberately did NOT ship remote push. Reasons:

1. **No parent account to attach a token to yet.** The native app's auth is still a
   stub (issue #54 seam): there is no real bearer-token session, so there is no
   server-side parent account to store a push token against. Storing a token
   "behind the account" (issue #56 requirement 4) is not yet possible.
2. **Compliance burden.** A push token is a persistent identifier. Under COPPA
   (docs/COMPLIANCE-COPPA.md section 6) persistent identifiers are the sensitive
   area. Remote push adds a stored identifier, a backend endpoint, server-side send
   infrastructure, and Expo push credentials, all for a use case (a nightly
   reminder) that a local schedule already covers with zero data collection.
3. **Expo Go limits.** Remote push is unavailable in Expo Go on Android since SDK
   53 and needs a development build plus an EAS `projectId`; local notifications
   work in Expo Go on SDK 57.

The seam is in place (`NotificationsProvider.getPushToken`, `easProjectId()`), so
turning remote push on later is additive. The backend endpoint it would call is
specified at the bottom of this doc.

## How it fits together

- **One reminder model in core.** The reminder time math and the parent-facing,
  dash-free copy live in `@bedtime-quests/core/notifications` (pure, unit-tested),
  so the copy rule (docs/WORKFLOW.md rule 1) is enforced once and reused.
- **Consent first, default off.** Reminders are OFF until the parent turns them on
  (COPPA section 3). The settings screen shows what the reminder is FOR before the
  OS permission prompt is ever requested (issue #56 requirement 1). A decline is
  respected: no nagging, and a path to the OS settings is offered (requirement 5).
- **Behind the parental gate.** Settings is a grown-up area, reached only after the
  parental gate (#32), per COPPA section 4.
- **A tap deep-links to the library.** Tapping the reminder opens the library
  (issue #56 requirement 3) via the app's navigator.
- **Runs with no native module.** When `expo-notifications` is absent (Expo Go
  without it, CI, this repo), the app uses an in-memory MOCK provider so the entire
  consent + settings flow is exercisable. It says plainly that reminders are
  simulated in that build.

## Code map

| Piece | File |
| --- | --- |
| Pure reminder model + copy (+ tests) | `packages/core/src/notifications.ts`, `packages/core/src/notifications.test.ts` |
| Notifications seam (interface) | `apps/mobile/src/notifications/types.ts` |
| Runtime SDK loader (device build only) | `apps/mobile/src/notifications/nativeNotifications.ts` |
| Real expo-notifications provider | `apps/mobile/src/notifications/expoProvider.ts` |
| Mock provider | `apps/mobile/src/notifications/mockProvider.ts` |
| Provider factory | `apps/mobile/src/notifications/index.ts` |
| Reminders context (consent + state) | `apps/mobile/src/notifications/context.tsx` |
| Settings UI (Notifications section) | `apps/mobile/src/screens/SettingsScreen.tsx` |
| Parental gate before Settings | `apps/mobile/src/components/TopBar.tsx` (+ `ParentalGate.tsx`, #32) |
| Deep-link on tap | `apps/mobile/src/navigation/Navigator.tsx` |
| Config (channel, deep link, EAS id) | `apps/mobile/src/notifications/config.ts` |

## Install and make a device build

Like the billing SDK (#55), this repo does NOT vendor `expo-notifications` into the
single root lockfile (adding an uninstalled dependency breaks `npm ci` on CI, and on
Windows drops the bundled wasm/@emnapi entries). Install it in your dev-build
environment, which updates `package.json` + the lockfile correctly:

```
cd apps/mobile
npx expo install expo-notifications expo-dev-client
npx expo run:android        # or run:ios, or an EAS development build
```

- **Local notifications** (what we ship) work in **Expo Go on SDK 57** once the
  module is installed, and in any dev build. No config plugin is required for local
  scheduling; the module autolinks. `loadNotifications()` picks it up at runtime;
  until then the app runs on the mock.
- Optional: to customize the Android small icon / color, add the config plugin to
  `app.json` (only after installing the module, or `expo start` will fail to resolve
  it):
  ```json
  { "expo": { "plugins": [["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#6C5CE7" }]] } }
  ```

## What is verified now vs. deferred

**Verified without a device (this change):**
- Core unit tests pass, including the reminder time math and the "no dashes in
  copy" guarantee (`npm run test` at the repo root).
- The mobile app typechecks with `expo-notifications` uninstalled (`npm run
  typecheck` in `apps/mobile`), because the module is loaded at runtime.
- The full consent + settings flow runs on the mock: turning the reminder on
  simulates the OS prompt, the time stepper and quick-pick presets change the time,
  and the denied-state path shows the OS-settings guidance. Force a decline with
  `EXPO_PUBLIC_NOTIF_MOCK_PERMISSION=denied`.

**Deferred (needs a real device / dev build):**
- The real OS permission prompt on iOS and Android, and a scheduled reminder
  actually firing at the chosen time (including after an app restart).
- A reminder tap cold-starting the app onto the library.
- Android channel creation and the notification's small icon / color.

## Deferred remote-push backend endpoint (specification)

When remote push is built (after native auth lands), the app registers its Expo
push token against the PARENT account through this endpoint. It is NOT implemented
yet.

- `POST /api/notifications/token`
  - Auth: the BetterAuth bearer session (the same parent-scoped auth the native app
    will use once `@better-auth/expo` is wired). 401 when unauthenticated.
  - Body: `{ "token": "ExponentPushToken[...]", "platform": "ios" | "android" }`.
  - Stores `(parentUserId, token, platform, updatedAt)` in a new `push_token` table,
    keyed by the PARENT user id. Never a child id or attribute (COPPA section 6c).
  - Upsert on `token` so a re-registration is idempotent.
- `DELETE /api/notifications/token`
  - Removes the caller's token (called on sign out or when the parent disables
    remote reminders).

Compliance notes for when it is built:

- The token is a persistent identifier tied to the ADULT account. It must be
  deletable: cascade `push_token` from the parent `user` row so account deletion
  (docs/COMPLIANCE-COPPA.md section 5) removes it, and delete it on sign out.
- Any server-sent reminder must use the SAME warm, dash-free, parent-facing,
  no-child-data copy as the local reminder (reuse `reminderNotificationContent`).
- Sending uses the Expo Push API server-side; no ad or analytics identifiers ride
  along, and there is no behavioral targeting (COPPA section 6a).
