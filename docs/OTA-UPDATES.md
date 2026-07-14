# Over the air updates (EAS Update) — issue #67

This is how Bedtime Quests ships JavaScript, most assets, and new **story content**
to already installed native apps **without a new store build**, using Expo EAS Update
(`expo-updates`). It is the mechanism that makes the monthly story cadence
([STORY-CADENCE.md](STORY-CADENCE.md)) reach phones the same day you publish, instead
of waiting on an App Store / Play review.

Read this alongside:

- [TESTFLIGHT-PLAY-TESTING.md](TESTFLIGHT-PLAY-TESTING.md) — the build/submit pipeline
  and the central "store build ships the mock providers" gotcha, which OTA shares.
- [STORY-CADENCE.md](STORY-CADENCE.md) — the monthly story playbook; its publish step
  now ends with an OTA publish (see section 8 below).

All user facing copy in the app stays dash free, clickable things look clickable, and
text is high contrast ([WORKFLOW.md](WORKFLOW.md) UI rules 1 to 3).

---

## 1. How it is wired

Three pieces, all already in the repo:

| Piece | Where | What it does |
| --- | --- | --- |
| Update URL + policy | `apps/mobile/app.json` → `expo.updates` and `expo.runtimeVersion` | Points the app at the EAS Update server and sets the compatibility policy. |
| Channels | `apps/mobile/eas.json` → each `build.*.channel` | Ties each build profile to a release stage (see the table below). |
| App strategy | `apps/mobile/src/updates/*` | Checks on launch, downloads in the background, applies on the next cold start. Optional on brand "update ready" notice. |

The app code follows the same **provider seam** pattern as billing, notifications,
linking, and connectivity: an `UpdatesProvider` interface (`src/updates/types.ts`), a
real provider over `expo-updates` (`expoUpdatesProvider.ts`), an in memory mock
(`mockProvider.ts`), a factory (`index.ts`), and a context that owns the strategy
(`context.tsx`). So Expo Go, a dev client, CI, and this repo all run the mock and
never crash reaching for a native module; a real store / preview build that ran
`npm run prepare:device-build` gets the real one.

### `app.json` block

```jsonc
"runtimeVersion": { "policy": "fingerprint" },
"updates": {
  "url": "https://u.expo.dev/REPLACE_WITH_EAS_PROJECT_ID",
  "enabled": true,
  "checkAutomatically": "ON_ERROR_RECOVERY",
  "fallbackToCacheTimeout": 0
}
```

- `fallbackToCacheTimeout: 0` — the app **never waits** at launch for an update. It
  always starts instantly from its cached bundle; downloading happens in the
  background. A bedtime session is never blocked on the network.
- `checkAutomatically: ON_ERROR_RECOVERY` — the **app**, not the native layer, drives
  the normal launch check (`src/updates/context.tsx`), so the "update ready" state is
  a single source of truth and there is no double download. The native layer still
  self heals on a crash loop.
- `url` / `extra.eas.projectId` carry a `REPLACE_WITH_EAS_PROJECT_ID` placeholder;
  `eas update:configure` fills in the real values on first setup (section 5).

---

## 2. Channels map to release stages

Channels are set per build profile in `eas.json`, so a build permanently follows one
channel and only ever receives updates published to it. This is how a preview build
and a production build stay isolated.

| Build profile (`eas.json`) | Channel | Stage | Who runs it |
| --- | --- | --- | --- |
| `development` | `development` | Local dev client | You, on a dev build |
| `preview` | `preview` | Pre store QA (internal distribution APK / simulator) | You / testers, direct install |
| `production` | `production` | Store builds (TestFlight, Play internal track, public release) | Testers (#59) and end users |

Note from #59: TestFlight and the Play **internal** testing track are fed by the
**`production`** build profile, so internal testers run the `production` channel. The
`preview` channel is for ad hoc internal distribution builds **outside** the stores.
Promote through them left to right: publish to `preview`, verify, then promote the
**same** bundle to `production` (section 6).

---

## 3. The runtimeVersion policy (why OTA cannot reach an incompatible binary)

`runtimeVersion` is the compatibility key: an update is only delivered to a build
whose runtime version matches. We use the **`fingerprint`** policy, which hashes the
native project (native dependencies, config plugins, permissions, entitlements, the
Expo SDK, app config that affects native code). Any change to those produces a **new**
fingerprint, so:

- A JS / asset / content only change keeps the same fingerprint → it ships over the
  air to existing builds. ✅
- A native change (new native module, new permission, SDK bump, config plugin edit)
  changes the fingerprint → old builds are **not** eligible for that update, so you
  cannot accidentally push JS that expects native code the installed binary does not
  have. It forces a new store build instead. ✅

This is exactly the guardrail issue #67 asks for: OTA updates only reach compatible
binaries, automatically, with no manual version bookkeeping.

---

## 4. Update strategy in the app

Owned by `src/updates/context.tsx`, on every cold launch:

```
check for update  →  download in the background  →  mark "ready"  →  apply on NEXT cold start
```

- **Never a disruptive mid story reload.** The context never calls `reloadAsync()` on
  its own. A downloaded update is staged and the native launcher swaps it in on the
  next cold start, so a child is never interrupted mid read.
- **Optional, on brand notice.** `src/components/UpdateReadyNotice.tsx` renders only
  when an update is downloaded and pending, and only on the **Library** (the calm home
  base, never inside a story). It is a flat, non interactive Paper Cut card with
  high contrast ink and **dash free** copy that reassures the update will be added on
  the next open, plus an **optional** "add them now" button (a user initiated reload
  from a calm screen). If no one taps it, the update still applies silently next cold
  start.
- **Simulate it** without a real OTA build: set `EXPO_PUBLIC_FORCE_UPDATE_READY=1`
  (mirrors `EXPO_PUBLIC_FORCE_OFFLINE` from #66). The notice appears on the Library in
  Expo Go so you can check the copy and layout.

---

## 5. First time setup (run once, on your EAS account)

These need your Expo account and are not runnable in CI or this session.

```bash
npm install --global eas-cli        # if you do not have it
cd apps/mobile
eas login
eas update:configure                # writes the real extra.eas.projectId + updates.url into app.json
```

`eas update:configure` replaces the `REPLACE_WITH_EAS_PROJECT_ID` placeholders with
your real project id. Commit that change.

**OTA needs the native module in the binary.** Like real IAP (#55) and push (#56), the
`expo-updates` native module is intentionally kept off master's lockfile (Windows
wasm/@emnapi CI gotcha). So an OTA **capable** build must first install the native
modules locally, then build:

```bash
cd apps/mobile
npm run prepare:device-build        # now also installs expo-updates (throwaway, do NOT commit the lockfile change to master)
eas build --profile production --platform all
```

A store build made from master **as is** ships the mock and will not receive OTA
updates. Only builds made after `prepare:device-build` are OTA capable.

---

## 6. The commands you actually run

All from `apps/mobile`. `--environment` loads the same EAS environment variables the
matching build profile uses, so the OTA JS bundle sees the same config as the binary.

**Publish an update to a channel (QA first):**

```bash
eas update --branch preview --message "March 2027 stories" --environment preview
```

**Verify on a preview build, then promote the SAME tested bundle to production:**

```bash
eas update:republish --destination-channel production --message "March 2027 stories"
```

`republish` reuses the exact bundle you tested rather than rebuilding it, so what
production gets is byte for byte what you verified on preview. (This works because
preview and production builds share a runtime version whenever the native project has
not changed, which is the case for a content only update.)

**Straight to production (small fix you have already validated):**

```bash
eas update --branch production --message "Fix typo on ending screen" --environment production
```

---

## 7. Rollback and verification

**Roll back a bad update** — pick the one that fits:

```bash
# Interactive guide (choose republish-a-previous or roll-back-to-embedded):
eas update:rollback

# Kill a bad OTA and send clients back to the JS bundled in their installed binary:
eas update:roll-back-to-embedded --channel production --message "Roll back March update"

# Re-publish a specific known good earlier update to the channel:
eas update:republish --destination-channel production
```

A rollback is itself just another update, so it reaches devices the same way (on their
next launch). Publishing a new good update afterwards supersedes the rollback for
everyone.

**Verify an update reached devices:**

```bash
eas update:list --branch production      # see published update groups, newest first
eas update:view <group-id>               # platforms, runtime version, message, who published
```

On a device: the app reads its own `channel` and `runtimeVersion` through the seam
(`useAppUpdates()`), and after a cold start the new content (a new story card, changed
copy) is simply present. For a hard confirmation, publish a visible tell (a new story
in the Library), fully close and reopen the app twice (once to download, once to
apply), and confirm it appears.

---

## 8. Shipping the monthly story batch via OTA

This is the repeatable tail end of the [STORY-CADENCE.md](STORY-CADENCE.md) publish
step, for the **native app** specifically. The web app publishes stories by seeding
Neon (`npm run db:seed`); the native app bundles the same authored story files
(`content/stories/*.ts` resolved into `apps/mobile/src/content`), so a new story is a
**content only, OTA eligible** change.

Once the month's stories pass QA and are seeded to the web database:

1. From `apps/mobile`, publish to preview and smoke test on a preview build:
   `eas update --branch preview --message "<month> stories" --environment preview`.
2. Promote the tested bundle to production:
   `eas update:republish --destination-channel production --message "<month> stories"`.
3. Verify with `eas update:list --branch production` and by opening a production /
   TestFlight build cold twice and confirming the new story cards appear.
4. If anything is wrong, `eas update:roll-back-to-embedded --channel production` and
   fix forward.

Because adding a story is content only, the fingerprint runtime version does not
change, so every installed production build is eligible and gets the new stories on
its next cold start. No store submission is needed for a normal monthly batch.

---

## 9. OTA can vs needs a new store build

The single most important boundary. When in doubt, if it touches anything in the table's
right column, it needs a **new binary**, not an OTA update. The `fingerprint` policy
enforces this automatically (a right column change bumps the runtime version, so old
builds are simply not served), but knowing it up front saves a wasted publish.

| OTA can change (JS / assets / content) | Needs a NEW store build (native) |
| --- | --- |
| New stories and story edits (`content/stories/*.ts`) | Adding or upgrading a native module (`react-native-purchases`, `expo-notifications`, `@react-native-community/netinfo`, `expo-updates` itself, etc.) |
| Screen logic, navigation, gating, copy fixes | New OS permission or entitlement (camera, notifications capability, associated domains) |
| Styles, layout, Paper Cut tokens | Expo SDK bump or React Native version change |
| Bundled JS images / fonts / small assets | Any config plugin change or `app.json` native config (icons, splash, scheme, intent filters, bundle id) |
| Pure `@bedtime-quests/core` rule changes | New app icon / splash, store metadata, version/build number for the stores |
| Changing an `EXPO_PUBLIC_*` value baked into the JS bundle | Anything that changes the native `runtimeVersion` fingerprint |

**No secrets in updates.** An OTA bundle is JavaScript shipped to devices, exactly like
the binary's bundle. Never put a secret in it and never read or commit `.env.local`.
Only public config (`EXPO_PUBLIC_*`, loaded per environment) belongs in an update.
