# Deep links & universal / app links (issue #65)

How a tapped link opens the Bedtime Quests native app on the right screen: a
custom URL scheme for internal deep links, plus **verified** Universal Links (iOS)
and App Links (Android) so a `https://bedtimequests.com/...` URL opens the app.

Everything is wired now. Two real-world values are unknown until the Apple/Play
signing setup exists (#58/#59), so they are served as clearly marked
**placeholders** you replace with one env var each. See [What you must fill in](#what-you-must-fill-in).

---

## The scheme

| | Value |
| --- | --- |
| Custom scheme | `bedtimequests://` (app.json `scheme`, from #58) |
| Universal/App Link domain | `bedtimequests.com` (the canonical domain from #43) |
| iOS bundle id / Android package | `com.bedtimequests.app` (#58) |

The custom scheme handles **internal** deep links and works without any web
verification. Universal/App links use the real https domain and require the two
association files below to be deployed and the signing identifiers to match.

## URL to screen map

One pure function decides this for every platform:
[`parseDeepLink`](../packages/core/src/deep-links.ts) in `@bedtime-quests/core`
(unit-tested in `deep-links.test.ts`). The native navigator
([`Navigator.tsx`](../apps/mobile/src/navigation/Navigator.tsx)) maps the result
onto its existing screen stack; nothing about the navigation model changed.

| Link | Opens | Kind |
| --- | --- | --- |
| `bedtimequests://` , `bedtimequests://library` , `bedtimequests://home` | Library (home) | custom scheme |
| `https://bedtimequests.com/story/<slug>` , `bedtimequests://story/<slug>` | that story in the Reader | **universal/app link** + scheme |
| `https://bedtimequests.com/collection` , `bedtimequests://collection` | Collection / Achievements | **universal/app link** + scheme |
| bedtime reminder tap (#56) | Library | in-app (reuses the library target) |
| anything unknown or malformed | Library (never crashes) | fallback |

Notes:
- A `/story/<slug>` link whose slug is not a real story falls back to the library
  rather than opening a broken reader.
- The site **root `/`** and the public legal pages (`/privacy`, `/terms`,
  `/support`) are deliberately **not** universal-link paths, so a plain link to
  bedtimequests.com stays in the browser and is never hijacked into the app. The
  home/library screen is still reachable via the custom scheme.
- Cold start vs backgrounded: a link that **launches** the app is stashed and
  honored the moment the auth + reader gates are passed (so a tapped story link
  still lands on that story after sign in and picking a reader); a link that
  arrives while the app is **running** routes immediately.

## Native configuration (`apps/mobile/app.json`)

- `scheme: "bedtimequests"` — the custom scheme (already set in #58). Expo turns
  this into the iOS URL type and the Android scheme intent filter at build time.
- `ios.associatedDomains: ["applinks:bedtimequests.com"]` — enables Universal
  Links; iOS fetches the Apple association file from that domain to verify.
- `android.intentFilters` with `autoVerify: true` for `https://bedtimequests.com`
  path prefixes `/story` and `/collection` — enables verified App Links; Android
  fetches `assetlinks.json` to verify.

These only take effect in a real build (`npx expo prebuild` / EAS build), not in
Expo Go.

## Web-hosted association files (served by the root web app)

Both are Next.js Route Handlers so the content type is exact and the identifiers
come from env. They are **public** (allowlisted in [`proxy.ts`](../proxy.ts) so the
auth gate does not redirect the OS verifiers) and contain no personal data.

| File | Route | Content-Type |
| --- | --- | --- |
| Apple | [`/.well-known/apple-app-site-association`](../app/.well-known/apple-app-site-association/route.ts) | `application/json`, no extension |
| Android | [`/.well-known/assetlinks.json`](../app/.well-known/assetlinks.json/route.ts) | `application/json` |

The JSON is built in [`lib/deep-links.ts`](../lib/deep-links.ts) (tested in
`lib/deep-links.test.ts`) from the shared `APP_LINK_PATHS` in core, so the paths
the files claim always match what the app routes.

---

## What you must fill in

Set these as **environment variables in the Vercel project** (Settings ->
Environment Variables), then **redeploy** (the files are prerendered at build
time). Neither is a secret; both are safe to store as plain env vars. Do **not**
put them in `.env.local` for production — set them in Vercel.

### 1. Apple Team ID -> `APPLE_TEAM_ID`

- Where: <https://developer.apple.com> -> **Membership** -> Team ID (10 chars,
  e.g. `A1BCDE2FG3`). The same value that goes into `eas.json` `appleTeamId` (#58).
- Until set, the AASA `appID` reads `TEAMID_REPLACE_AFTER_APPLE_ENROLLMENT.com.bedtimequests.app`
  and Universal Links will not verify (no harm, just inactive).

### 2. Android signing-cert SHA-256 -> `ANDROID_SHA256_CERT_FINGERPRINTS`

- Where: this is the fingerprint of the key that **signs the installed app**:
  - With **Play App Signing** (the default via EAS submit, #59): Play Console ->
    your app -> **Test and release -> App integrity -> App signing** -> the
    **App signing key certificate** SHA-256.
  - Also list the **upload / EAS key** fingerprint so internal-track builds
    verify: `eas credentials` (Android) shows it, or Play Console shows the
    "Upload key certificate" SHA-256.
- Format: uppercase colon-separated hex. List more than one comma-separated, e.g.
  `AA:BB:...:FF, 11:22:...:99`.
- Until set, `assetlinks.json` serves `REPLACE_WITH_ANDROID_SHA256_CERT_FINGERPRINT`
  and App Links will not verify.

---

## How to verify end to end (needs the deploy + a device)

What was verified in development already:
- Web serves both files at the right paths with `content-type: application/json`,
  HTTP 200, and **not** redirected by the auth gate (curled locally).
- The app config is valid and the app typechecks / the web app builds.
- The URL-to-screen map is unit-tested for every case (scheme, https, Expo Go
  `--` form, unknown/malformed fallback) in `packages/core/src/deep-links.test.ts`.

What needs the deployed files + a signed build on a real device:

1. **Deploy** with `APPLE_TEAM_ID` and `ANDROID_SHA256_CERT_FINGERPRINTS` set, then
   confirm the files are live over HTTPS:
   ```
   curl -i https://bedtimequests.com/.well-known/apple-app-site-association
   curl -i https://bedtimequests.com/.well-known/assetlinks.json
   ```
   Both should be `200` / `application/json` with your real identifiers (no
   `REPLACE_...` / `TEAMID_...` placeholders).
2. **Apple validators:** Apple's CDN caches the AASA; use Apple's
   [App Site Association API](https://app-site-association.cdn-apple.com/a/v1/bedtimequests.com)
   to see what Apple has fetched, or the AASA validator in Xcode / a third-party
   checker.
3. **Android validator:** Google's Statement List Tester:
   `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://bedtimequests.com&relation=delegate_permission/common.handle_all_urls`
   should return your statement. `adb shell pm verify-app-links --re-verify com.bedtimequests.app`
   then `adb shell pm get-app-links com.bedtimequests.app` should show
   `bedtimequests.com: verified`.
4. **Custom scheme (no deploy needed), on a dev build or simulator:**
   ```
   # iOS simulator
   xcrun simctl openurl booted "bedtimequests://story/starlight-sail"
   # Android emulator
   adb shell am start -a android.intent.action.VIEW -d "bedtimequests://collection"
   ```
   Each should open the app on the mapped screen. You can also simulate a
   **cold-start** link locally without a device by setting
   `EXPO_PUBLIC_LINK_INITIAL_URL=bedtimequests://story/starlight-sail` before
   `expo start` (the app behaves as if launched by that tap).
5. **Universal/App links (real device, after step 1):** tap a
   `https://bedtimequests.com/story/<slug>` link from Notes / an email / a QR code.
   iOS opens the app (a long-press shows "Open in Bedtime Quests"); Android opens
   it directly once `autoVerify` has succeeded.
