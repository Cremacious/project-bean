# TestFlight and Play internal testing (issue #59)

The build-and-distribute pipeline that puts real, correctly signed native builds of
**Bedtime Quests** onto **TestFlight** (iOS) and the **Play internal testing** track
(Android), so you can install them on a device and verify the app end to end,
including the in-app purchases (#55) and the bedtime reminder (#56).

This picks up where account enrollment ([`docs/STORE-ACCOUNTS.md`](STORE-ACCOUNTS.md),
#58) left off. Everything that can live in the repo is wired; the steps that need
**your** legal identity, payment, credentials, or a console click are marked

> 🔒 **YOU** — needs your account / credentials / a console click.

Nothing here reads, prints, or commits `.env.local` or any secret. iOS signing is
EAS managed; the Play service-account key lives in the **gitignored** `credentials/`
folder; the RevenueCat public keys go into EAS environment variables (they are public
by design, see [`apps/mobile/.env.example`](../apps/mobile/.env.example)).

---

## 0. The one thing that is easy to get wrong

A plain `eas build --profile production` of this repo **ships the mock** billing and
notifications providers, because `react-native-purchases` and `expo-notifications`
are deliberately **not** in the committed lockfile (adding them breaks `npm ci` on the
web CI and drops the wasm/@emnapi entries on Windows — see the
`windows-lockfile-wasm-emnapi-ci` note and [`docs/BILLING-REVENUECAT.md`](BILLING-REVENUECAT.md)).

**To test real IAP and real push on device you must install those native modules into
the build first** (§3). A build without them still installs and runs (auth, reading a
story, the parental gate, and the paywall/reminder UI all work on the mock), but a
purchase will not hit the store and a reminder will not hit the OS scheduler. Decide
up front which build you want:

| Build | Includes native IAP + push? | Use it to test |
| --- | --- | --- |
| **UI build** (repo as-is) | No (mock providers) | Sign in, reading flow, parental gate, paywall/reminder **screens** |
| **Device build** (after §3) | **Yes** | Everything above **plus** real purchase/restore and a real firing reminder |

For #59's goal (verify #55 and #56 on device) you want the **device build**.

---

## 1. How the profiles map (already in `eas.json`)

[`apps/mobile/eas.json`](../apps/mobile/eas.json) is complete and schema-valid. The
mapping is deliberately: you **build** with the `production` profile and **submit**
with the `internal` profile.

| Step | iOS | Android |
| --- | --- | --- |
| `eas build --profile production` | store-signed **IPA** (distribution cert + provisioning, EAS managed) | **AAB** signed with the EAS-managed upload key |
| `eas submit --profile internal` | uploads to App Store Connect → lands in **TestFlight** | uploads to the **internal testing** track |

The `production` build profile is also what you later ship to the App Store / Play
production (`eas submit --profile production`); TestFlight and Play internal use the
**same** store binary, only the submit target differs. Each build profile is bound to
an EAS **environment** (`development` / `preview` / `production`) so the public
RevenueCat keys and API URL inject automatically at build time (§3.2).

Other build profiles: `development` (dev client, iOS simulator) and `preview`
(internal distribution, Android **APK** for quick sideload) — neither is used for
store testing.

---

## 2. One-time setup (before your first build)

### 2.1 Link the repo to your Expo project
> 🔒 **YOU** — needs your Expo account.
```bash
cd apps/mobile
eas login
eas init          # creates the EAS project for slug "bedtime-quests";
                  # writes owner + extra.eas.projectId into app.json
```
Commit the `owner` / `extra.eas.projectId` that `eas init` adds to `app.json` (not
secrets). This also gives you the `projectId` that remote push (deferred, #56) will
later need.

### 2.2 Paste the store IDs into `eas.json`
> 🔒 **YOU** — from your App Store Connect + Apple Developer accounts (#58 §6).

Replace the two placeholders in **both** submit profiles in `eas.json`:

| Placeholder | Where to get it |
| --- | --- |
| `REPLACE_WITH_APP_STORE_CONNECT_APP_ID` (`ascAppId`) | App Store Connect → your app → App Information → **Apple ID** (a number like `6501234567`) |
| `REPLACE_WITH_APPLE_TEAM_ID` (`appleTeamId`) | developer.apple.com → **Membership** → Team ID (10 chars, e.g. `A1BCDE2FG3`) |

These are not secrets; commit them.

### 2.3 iOS signing + the App Store Connect API key (EAS managed)
> 🔒 **YOU** — needs your Apple account. All interactive, one-time.

Let EAS generate and store the **distribution certificate** and **provisioning
profile** — do **not** create or commit any `.p8` / `.p12` / `.mobileprovision` (the
mobile `.gitignore` already blocks them). The simplest path is to just run the first
build (§4.1) and accept the prompts. To set it up explicitly instead:
```bash
cd apps/mobile
eas credentials -p ios          # menu: Build Credentials → let EAS manage everything
```
For `eas submit` to upload, EAS needs an **App Store Connect API key**:
1. 🔒 App Store Connect → **Users and Access → Integrations → App Store Connect API**
   → **+** → role **App Manager** (or Admin) → download the `.p8` **once**.
2. Hand it to EAS (stored on Expo's servers, never in the repo):
   ```bash
   eas credentials -p ios       # menu: App Store Connect API Key → set up
   ```
   or let `eas submit` prompt for it the first time.

### 2.4 Android signing + the Play service account (EAS managed key, gitignored JSON)
> 🔒 **YOU** — needs your Google Play + Google Cloud accounts.

- **Upload keystore:** let EAS generate and hold it. Accept the prompt on the first
  Android build, or run `eas credentials -p android`. On the **first** upload of a new
  app, Play automatically enrols it in **Play App Signing** (Google holds the app
  signing key and re-signs; you only ever ship the upload key). Nothing to commit.
- **Service-account JSON** (so `eas submit` can push to the internal track):
  1. 🔒 Play Console → **Setup → API access** → create/link a Google Cloud service
     account → grant it release permissions (Admin or a custom role with **Releases**).
  2. Download its JSON key.
  3. Save it to `apps/mobile/credentials/play-service-account.json`. Create the folder
     locally; it is **gitignored** and can never be committed:
     ```bash
     mkdir -p apps/mobile/credentials
     # move the downloaded JSON to apps/mobile/credentials/play-service-account.json
     ```

---

## 3. Prepare a device build that includes real IAP + push

Do this only for the **device build** (§0). It changes `package.json` and the **root**
lockfile, so treat it as a **local, throwaway** step — **do not commit the lockfile
change to `master`** (it would drop the web CI's wasm/@emnapi entries). Work on a
scratch branch you discard, or leave the changes uncommitted.

### 3.1 Install the native modules
```bash
cd apps/mobile
npm run prepare:device-build
#   == expo install react-native-purchases expo-notifications expo-dev-client
```
`react-native-purchases` and `expo-notifications` autolink (no config plugin needed
for local scheduling or purchases). The app's runtime loaders (`loadPurchases()`,
`loadNotifications()`) pick them up automatically once present; until then it runs the
mock. `expo-dev-client` is only needed if you also want an internal dev build.

> ⚠️ On Windows this rewrites the shared root `package-lock.json` and may drop the
> `@emnapi` wasm entries the web build needs. **Keep this off `master`.** If you ever
> do need to reconcile the lockfile, re-apply the `@emnapi` fix from the
> `windows-lockfile-wasm-emnapi-ci` note before pushing to `master`.

### 3.2 Give the cloud build the RevenueCat public keys
> 🔒 **YOU** — needs your RevenueCat public keys (see [`docs/BILLING-REVENUECAT.md`](BILLING-REVENUECAT.md) §3).

EAS cloud builds do **not** see your local `.env.local`, so set the public keys as EAS
environment variables in the **production** environment (the `production` build profile
is bound to it). They are public (`appl_` / `goog_` app-specific keys), so plaintext is
fine — never put a store **secret** or the RevenueCat **secret** key here.
```bash
cd apps/mobile
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_KEY     --value "appl_xxx" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "goog_xxx" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_API_URL                --value "https://YOUR_DOMAIN" --visibility plaintext
# confirm flags for your CLI version with:  eas env:create --help
```
Without these the device build simply falls back to the mock billing provider (safe,
but not a real purchase). `EXPO_PUBLIC_API_URL` is optional — it lets the app cross
check entitlement against `GET /api/entitlements/current`.

### 3.3 Store products must exist for a real purchase
> 🔒 **YOU** — App Store Connect + Play Console + RevenueCat.

A real sandbox/test purchase needs the subscription products (`bedtimequests_premium_monthly`,
`bedtimequests_premium_yearly`) created and attached to the RevenueCat `premium`
entitlement. Follow [`docs/BILLING-REVENUECAT.md`](BILLING-REVENUECAT.md) §2–3. The
paywall UI still renders and the mock purchase still works without them.

---

## 4. Build and submit

### 4.1 iOS → TestFlight
> 🔒 **YOU** — runs against your Apple account; first run prompts for signing (§2.3).
```bash
cd apps/mobile
eas build   --profile production --platform ios      # produces a store-signed IPA
eas submit  --profile internal   --platform ios      # uploads it to App Store Connect → TestFlight
```
- The build runs in EAS cloud (no Mac needed). Watch it finish in the terminal or at
  `expo.dev`.
- After `eas submit`, the build appears under **App Store Connect → your app →
  TestFlight** within a few minutes (it must finish Apple's automatic processing).
- You can also skip `eas submit` and upload the `.ipa` by hand via **Transporter** if
  you prefer for the very first upload.

### 4.2 Android → Play internal testing
> 🔒 **YOU** — runs against your Play account; first run prompts for the keystore (§2.4).
```bash
cd apps/mobile
eas build   --profile production --platform android  # produces a signed AAB
eas submit  --profile internal   --platform android  # uploads it to the internal track
```
- `eas submit` uses `credentials/play-service-account.json` and pushes to
  `track: internal`.
- **First upload gotcha:** Google sometimes rejects the automated first upload to a
  brand-new app until one AAB has been uploaded **by hand** and Play App Signing is
  accepted. If `eas submit` errors on the first ever upload, download the AAB from the
  EAS build page and upload it once manually at **Play Console → your app → Testing →
  Internal testing → Create new release**, accept Play App Signing, then use
  `eas submit` for every release after.

### 4.3 Both at once
```bash
eas build  --profile production --platform all
eas submit --profile internal   --platform all
```

---

## 5. Set up testers and install on your device

### 5.1 iOS — TestFlight internal testers
> 🔒 **YOU** — App Store Connect + the TestFlight app on your device.
1. App Store Connect → your app → **TestFlight → Internal Testing**.
2. **Internal testers** must be members of your App Store Connect team (Users and
   Access). Add yourself / teammates there first, then add them to an internal testing
   group. Internal testers get every build immediately with **no beta review**.
3. Assign the processed build to the internal group.
4. On the device: install the **TestFlight** app from the App Store, sign in with the
   invited Apple Account, accept the invite, and install Bedtime Quests.
5. (External testers — friends outside your team, up to 10,000 — need a public/opt-in
   group and a one-time **beta review**. Not needed to test yourself.)

### 5.2 Android — Play internal testing testers
> 🔒 **YOU** — Play Console + the device signed into a tester Google account.
1. Play Console → your app → **Testing → Internal testing → Testers**.
2. Create an email list (up to **100** testers), add the Gmail addresses, save.
3. Copy the **opt-in / join URL** for the track.
4. On the device (signed into a tester Google account): open the opt-in URL, tap
   **Become a tester**, then the Play Store link to install Bedtime Quests.
   Propagation can take a few minutes after the first release.

---

## 6. Purchases without real charges (test/sandbox accounts)

> 🔒 **YOU** — create these test accounts before running the purchase checklist.

**iOS — Sandbox Apple Account:**
1. App Store Connect → **Users and Access → Sandbox → Test Accounts** → create a
   sandbox tester (use an email you control that is **not** a real Apple Account).
2. TestFlight builds use the **StoreKit sandbox automatically** — you are **not**
   charged. When you tap subscribe, sign in with the **sandbox** account if prompted.
   (You can pre-set it on device under Settings → App Store → Sandbox Account.)
3. Sandbox subscription renewals are **accelerated** (e.g. a month renews in minutes)
   and the 7 day trial is shortened, which is ideal for testing renewal/restore.

**Android — License testers:**
1. Play Console → **Setup → License testing** → add the tester Gmail addresses (the
   same accounts on the internal track).
2. License testers see subscriptions as **test purchases** with **no charge** and
   **accelerated renewals**. Test purchases only work for builds from the internal
   (or other test) track, signed by Play App Signing.

Both stores: because RevenueCat is the on-device source of truth, a successful
sandbox/test purchase unlocks the `premium` entitlement exactly like a real one, and
(if the webhook + `EXPO_PUBLIC_API_URL` are wired) writes the parent's entitlement row
server side so the web app agrees.

---

## 7. On-device test checklist

Run this once the **device build** (§3) is installed via TestFlight / Play internal.
Items marked **(deferred earlier)** are the ones #55/#56 could not verify without a
real device or store products.

**App core**
- [ ] Cold launch shows the native splash (paper-boat art on navy) and the app opens.
- [ ] **Sign in** reaches the child picker. (Auth is still a local stub, #54 seam — you
      are verifying the on-device flow and navigation, not a real server session yet.)
- [ ] Pick a reader; the child's name personalizes the story copy.
- [ ] **Read a story to an ending** — choices advance, the ending screen shows, and it
      is recorded for the collection/achievements view.
- [ ] No dashes in any displayed copy; every tappable control reads as tappable; text
      is high-contrast (UI rules 1–3).

**Parental gate (#32)**
- [ ] Opening **Settings** requires the parental gate first.
- [ ] Starting a purchase requires the parental gate first.
- [ ] A wrong answer does not pass; the gate copy is warm and dash-free.

**In-app purchase (#55) — (deferred earlier)** — using the sandbox / license tester (§6)
- [ ] Paywall shows live store offerings (monthly + yearly, prices, 7 day trial, yearly
      savings) — not the mock's "simulated" copy.
- [ ] Buy **monthly**: the 7 day free trial starts, premium unlocks **immediately**,
      premium-gated stories become available.
- [ ] Buy **yearly** (fresh sandbox/test account): same unlock.
- [ ] Force-quit and reopen → still premium.
- [ ] **Restore purchases** on a reinstall / second device with the same test account →
      premium returns.
- [ ] **Cancelled** and **error** paths land on warm, dash-free copy (no crash).
- [ ] iOS **Ask to Buy** (pending), if you can enable it on the sandbox account →
      lands on the "pending" copy, and approving later unlocks premium.
- [ ] If `EXPO_PUBLIC_API_URL` + the RevenueCat webhook are wired: after a purchase,
      `GET /api/entitlements/current` for the same parent shows premium (web agrees).

**Bedtime reminder (#56) — (deferred earlier)**
- [ ] Reminders are **OFF** by default; the Settings screen explains what the reminder
      is for **before** any OS prompt.
- [ ] Turning it on triggers the real **OS permission** prompt (iOS and Android).
- [ ] Set the time ~2 minutes ahead → the notification **actually fires** at that time.
- [ ] **Tap** the notification → the app deep-links to the **library**.
- [ ] Reminder still fires after an **app restart** / device reboot.
- [ ] Decline permission → no nagging, and the "open OS settings" path is offered.
- [ ] Android: the notification uses the correct channel, small icon, and color.
- [ ] Reminder copy carries **no child name or profile** data (COPPA).

> Remote push is still deferred (no native parent session yet — [`docs/NOTIFICATIONS.md`](NOTIFICATIONS.md)).
> Only the **local** reminder is expected to work here.

---

## 8. Later: wire builds into CI (TODO — do not build now)

Leave this as a deliberate TODO; it is not needed to test on device and is easy to
over-build. When you want it:

- Add a **manual** GitHub Action (`workflow_dispatch`) that runs
  `eas build --profile production --platform <all|ios|android> --non-interactive`.
- Auth it with an **`EXPO_TOKEN`** repo secret (create at `expo.dev` → Access Tokens),
  **never** committed. No Apple/Play secrets go in the repo — EAS holds the signing
  credentials and the Play service-account key.
- Consider triggering `eas submit --profile internal` from the same workflow, or keep
  submit manual so nothing reaches testers without a human click.
- The device-build native modules (§3) are the open question for CI: because they must
  not live in `master`'s lockfile, a CI build would need an `eas-build-post-install`
  hook (or a dedicated build branch) to add them on EAS's Linux runners. Resolve that
  before automating the **device** build; the UI build needs nothing extra.

**TODO(#59):** decide manual-Action vs. keep-local, and how CI installs the device-build
native modules, once the accounts and first manual builds are proven.

---

## 9. What is done in-repo vs. blocked on you

**Done in the repo (this change, #59):**
- `eas.json` finalized and schema-validated: `development` / `preview` / `production`
  build profiles (each bound to its EAS environment) + `internal` / `production` submit
  profiles routing iOS → TestFlight / App Store and Android → internal / production
  track. Signing is EAS managed; no secrets committed.
- `apps/mobile` npm script `prepare:device-build` to install the IAP + push native
  modules for a device build.
- This guide (build → submit → testers → sandbox purchases → on-device checklist → CI
  TODO).

**Blocked on you (credentials / console / payment — cannot be automated):**
- `eas login` / `eas init`; pasting `ascAppId` + `appleTeamId` into `eas.json` and the
  Play service-account JSON into `credentials/` (§2).
- iOS signing + App Store Connect API key, Android upload key + Play App Signing (§2.3–2.4).
- Creating the RevenueCat store products and EAS env vars (§3.2–3.3).
- Running the builds/submits (§4), adding testers (§5), and creating sandbox/license
  test accounts (§6).
- Running the on-device checklist (§7).

---

## Sources
- [Expo — Configure EAS Build with eas.json](https://docs.expo.dev/build/eas-json/) ·
  [iOS builds / credentials](https://docs.expo.dev/app-signing/app-credentials/) ·
  [Submit to the App Store](https://docs.expo.dev/submit/ios/) ·
  [Submit to Google Play](https://docs.expo.dev/submit/android/) ·
  [Environment variables in EAS](https://docs.expo.dev/eas/environment-variables/)
- [Apple — TestFlight](https://developer.apple.com/testflight/) ·
  [Sandbox testing for in-app purchases](https://developer.apple.com/apple-pay/sandbox-testing/)
- [Google Play — Internal testing](https://support.google.com/googleplay/android-developer/answer/9845334) ·
  [License testing for purchases](https://developer.android.com/google/play/billing/test)
- Related repo docs: [`STORE-ACCOUNTS.md`](STORE-ACCOUNTS.md) (#58),
  [`BILLING-REVENUECAT.md`](BILLING-REVENUECAT.md) (#55),
  [`NOTIFICATIONS.md`](NOTIFICATIONS.md) (#56).
</content>
</invoke>
