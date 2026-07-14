# Store accounts & submission setup (issue #58)

How to register the **Apple Developer Program** and the **Google Play Console**, and how
those accounts line up with the identifiers already committed to this repo. Enrollment
(paying, identity verification) is something **you** must do in person under your own legal
identity. This doc gets you through it correctly the first time and tells you exactly which
IDs to reuse so nothing has to be renamed later.

Product: **Bedtime Quests**. Native app: `apps/mobile` (Expo SDK 57, submitted via EAS).
This is a **child-directed** app, so both stores route it through extra kids/privacy review
later (issues #62/#63/#64) — noted inline below.

---

## 0. The identifiers this repo is now locked to

These are set in [`apps/mobile/app.json`](../apps/mobile/app.json) and
[`apps/mobile/eas.json`](../apps/mobile/eas.json). **When you create the store records you
must type these exact strings** — they are painful (Apple) or impossible (Google) to change
after first registration.

| Thing | Value | Where it must match |
| --- | --- | --- |
| iOS bundle identifier | `com.bedtimequests.app` | App Store Connect → new app → **Bundle ID** |
| Android package name | `com.bedtimequests.app` | Play Console → create app → **Package name** (permanent) |
| App display name | `Bedtime Quests` | Both store listings (App Name / App title) |
| Expo slug | `bedtime-quests` | EAS project (`eas init` creates it under your Expo account) |
| Deep-link scheme | `bedtimequests://` | Universal/App Links + RevenueCat + auth redirects |

**Android package names are permanent.** Once `com.bedtimequests.app` is uploaded to a Play
app, that app record is bound to it forever; a new package = a brand-new listing with no
reviews/installs. Apple's bundle ID is likewise fixed once an App ID + app record exist.

> Why `com.bedtimequests.app`? Standard 3-segment reverse-DNS scoped to the brand you own
> (`bedtimequests.com` / `bedtimequests.app`), valid on both platforms, and it leaves room
> for a second app later (`com.bedtimequests.<other>`). If you'd rather use `app.bedtimequests`
> (reverse of the `.app` domain) or `com.bedtimequests.mobile`, change both the `ios.bundleIdentifier`
> and `android.package` in `app.json` **before** you register either store app, and update the
> table above. After registration, don't.

---

## 1. Pre-flight checklist (have these ready before you start either enrollment)

- [ ] **Legal name / entity.** Decide **individual** vs **organization** (see §2 and §3). This
      is the single biggest branch and is hard to change later. Individual is faster and cheaper;
      organization hides your personal name from the public listing but needs a registered legal
      entity + D-U-N-S number.
- [ ] **Government photo ID** matching that legal name (both stores now verify identity).
- [ ] **Billing:** a credit/debit card. Apple = **$99/yr recurring**. Google = **$25 one-time**.
- [ ] **Address & phone** on record for the developer identity (Google publishes a contact
      address for the developer; use one you're willing to disclose — a registered business
      address is ideal if you go the org route).
- [ ] **Apple Account** (formerly Apple ID) with **two-factor authentication ON**, used only
      for this. Ideally a dedicated account, not your personal iCloud.
- [ ] **Google account** for the Play Console (a dedicated Workspace/Gmail is cleaner than a
      personal one).
- [ ] **App name availability:** confirm "Bedtime Quests" is free to reserve on **both** stores
      (App Store app names are globally unique; Play titles are less strict but check). Reserve
      it as soon as each account is live.
- [ ] **Support email** (a monitored address — both stores show it and use it for review
      correspondence). Suggest `support@bedtimequests.com`.
- [ ] **Marketing / privacy URLs** on `bedtimequests.com`:
      - Privacy policy URL (**required by both**, and mandatory for a kids' app) — from issue **#49**.
      - Support URL / marketing URL.
- [ ] **For the organization route only:** a **D-U-N-S number** for the legal entity (free from
      Dun & Bradstreet, can take **1–5+ business days**; get it started first — it's the long pole).
- [ ] **Two physical Apple devices are NOT required**, but you do need a Mac **or** the EAS cloud
      (this repo submits via EAS, so no Mac is needed for builds — see §5).

---

## 2. Apple Developer Program

**Cost:** $99 USD / year, recurring, same price for individual or organization.
**Where:** <https://developer.apple.com/programs/enroll/> or the **Apple Developer** app on an
iPhone/iPad (the app path is often the smoothest for identity verification).

### 2.1 Individual vs organization

| | Individual / sole proprietor | Organization |
| --- | --- | --- |
| Public "seller" name on the App Store | **Your personal legal name** | Your **company/legal entity name** |
| Requires a registered legal entity | No | **Yes** (LLC, corp, etc.) |
| Requires a **D-U-N-S number** | No | **Yes** — Apple uses it to verify the entity |
| Identity check | Government photo ID | ID **and** proof you can bind the entity legally |
| Typical time to approved | Hours to ~2 days | **Days to weeks** (D-U-N-S + entity verification) |
| Can add team members / roles | Limited | Full App Store Connect team roles |

**Recommendation for a solo launch:** enroll as an **individual** to ship fastest; you can
migrate to an organization later, but it's a support-driven account transfer, so only choose
individual if you're OK with your personal name showing as the seller. If "Bedtime Quests"
is a real business you want to grow, do the **organization** route and **start the D-U-N-S
lookup today** (§1) because it gates everything.

### 2.2 Steps

1. Sign in at the enroll link with the 2FA-enabled Apple Account.
2. Choose entity type (individual vs organization). For org, enter the legal entity details
   and D-U-N-S number.
3. Complete Apple's **identity verification** (photo ID; org may need extra entity proof).
4. Pay the $99 and accept the **Apple Developer Program License Agreement**.
5. Wait for the "Welcome" email confirming membership is active.

### 2.3 What it unlocks and how it connects downstream

- **App Store Connect** (<https://appstoreconnect.apple.com>) — where you create the **app
  record**. When you create it you'll set:
  - **Bundle ID** → must be **`com.bedtimequests.app`** (create the matching **App ID** /
    identifier first under Certificates, Identifiers & Profiles, or let EAS create it — §5).
  - **SKU** → any stable internal string, e.g. `bedtime-quests-ios`.
  - **Primary language**, and the **App Name** → `Bedtime Quests`.
  - Note the numeric **Apple ID / "ASC App ID"** that App Store Connect assigns the app —
    you paste it into `eas.json` (`ascAppId`) and it's in §6.
- **Apple Team ID** — a 10-char string under Membership details; goes into `eas.json`
  (`appleTeamId`), see §6.
- **TestFlight** — internal/external testing (issue **#59**). Once a build is submitted via
  `eas submit`, it lands in TestFlight for internal testers first.
- **Kids Category / privacy:** because this app is child-directed, App Store Connect will
  require the **Age Rating** questionnaire and, if you list in the **Kids** category, the
  stricter kids rules (no third-party analytics/ads without compliance, parental gates for
  external links/purchases). Those questionnaires are issues **#62 / #63 / #64** — you'll
  complete them at listing time, not at enrollment.

---

## 3. Google Play Console

**Cost:** $25 USD **one-time** registration fee.
**Where:** <https://play.google.com/console/signup>

### 3.1 Identity & developer verification (Google enforces this now)

Google requires **developer identity verification** for new accounts. Be ready to provide:

- Your **legal name and address** (for a personal account, **your own**; Google will **display
  a contact address** on your public developer profile).
- A **phone number** and **email**, both verified.
- **Government photo ID** and possibly additional verification depending on account type.
- **Organization accounts** additionally require a **D-U-N-S number** for the legal entity
  (same Dun & Bradstreet identifier as Apple — one D-U-N-S covers both).

Verification must be completed within Google's deadline or the account is limited; do it
promptly after paying.

### 3.2 Personal vs organization — and the testing requirement

| | Personal | Organization |
| --- | --- | --- |
| Public developer name | Your name or a chosen developer name, with a **contact address shown** | Legal entity name |
| D-U-N-S number | No | **Yes** |
| **Closed-testing gate before production** | **Yes** — see below | **No** |

**The closed-testing requirement (personal accounts):** Play accounts created **after 13 Nov
2023** as **personal** accounts must run a **closed test with at least 12 testers who stay
opted-in for 14 consecutive days** before you can apply for **production** access. (This was
originally 20 testers; Google reduced it to 12.) **Organization** accounts and personal
accounts created before that date are exempt.

**What this means for your timeline:** even after the app is built and internal testing works
(#59), a **personal** Play account can't push to production until you've lined up **12 real
testers for 14 straight days**. Plan for that: start recruiting testers early, or enroll as an
**organization** to skip it entirely. This is the Play-side long pole, analogous to Apple's
D-U-N-S wait.

### 3.3 Steps

1. Sign in at the signup link with the dedicated Google account.
2. Choose account type (personal vs organization).
3. Pay the **$25 one-time** fee.
4. Complete **identity verification** (ID, address, phone) within the deadline.
5. Accept the **Developer Distribution Agreement**.
6. **Create the app:** set the **App name** → `Bedtime Quests`, default language, and — on
   first upload — the **package name** which **must be `com.bedtimequests.app`** and is
   **permanent**.

### 3.4 What it connects to downstream

- **Internal testing track** (issue **#59**) — `eas submit --profile internal` (Android
  `track: internal` in `eas.json`) pushes builds straight to internal testing; up to 100
  testers, no review wait. This is where you'll verify first.
- **Closed testing** — the track you use to satisfy the 12-testers/14-days rule (personal
  accounts) before production.
- **Data safety form** (issue **#62**) — required before publishing; declares what data the
  app collects/shares. As a kids' app this must be accurate and consistent with your privacy
  policy (#49) and the **Play Families / Designed for Families** program requirements.
- **Content rating** questionnaire and the **Families** policy declarations — part of the
  kids-category work (#62/#63/#64).

---

## 4. How the accounts connect to the rest of the roadmap

| Account milestone | Unlocks | Issue |
| --- | --- | --- |
| Apple membership active | Create ASC app record, get `ascAppId` + `appleTeamId`, TestFlight | #58 → #59 |
| Play account verified | Create app, get internal-testing track | #58 → #59 |
| Both app records created with the IDs in §0 | `eas submit` works end-to-end | #59 |
| Kids/privacy questionnaires | Store review can pass for a child-directed app | #62 / #63 / #64 |
| Privacy policy URL live | Required field in both listings | #49 |

---

## 5. Building & submitting from this repo (what's already wired)

This repo uses **EAS** (`eas build` / `eas submit`); you do **not** need a Mac or local Xcode.
[`apps/mobile/eas.json`](../apps/mobile/eas.json) defines the profiles:

**Build profiles**
- `development` — dev client, internal distribution, iOS simulator build.
- `preview` — internal distribution, Android APK (easy sideload / QA).
- `production` — store build, `autoIncrement` on, `appVersionSource: remote` (EAS owns the
  build number, so no manual bumping and no merge conflicts on version).

**Submit profiles**
- `internal` — iOS → TestFlight; Android → `internal` track. Use for #59.
- `production` — iOS → App Store review; Android → `production` track, uploaded as `draft`
  (you press "release" in the console, so nothing auto-publishes).

**Credentials are NOT in the repo** (and must never be):
- **iOS signing** (distribution cert + provisioning profile) → let **EAS manage** them
  (`eas build` offers to generate and store them on Expo's servers). Nothing to commit.
- **App Store Connect API key** (for `eas submit` to upload) → upload it to EAS once
  (`eas credentials`) or store it as an EAS secret; do not put the `.p8` in git (the mobile
  `.gitignore` already blocks `*.p8` / `*.p12` / `*.mobileprovision`).
- **Play service account JSON** → referenced by `eas.json` as
  `./apps/mobile/credentials/play-service-account.json`. The `credentials/` folder is
  **gitignored** (added in this change). Create that folder locally, drop the JSON in, and it
  will never be committed. Alternatively upload it to EAS and remove the path.

**First-time linking (blocked until accounts exist — see §7):**
```bash
cd apps/mobile
eas login                 # your Expo account
eas init                  # creates the EAS project for slug "bedtime-quests"; writes extra.eas.projectId + owner into app.json
eas build --profile production --platform all
eas submit --profile internal --platform all
```
`eas init` is what adds `owner` and `extra.eas.projectId` to `app.json`; those are intentionally
**not** pre-filled here because they're minted against your Expo account at that step.

---

## 6. Exactly which IDs you paste back into the repo (after enrollment)

Fill these once the accounts and app records exist. None are secrets, so they're safe to
commit; the **secret** files (keys/JSON) stay out of git per §5.

| Placeholder in `eas.json` | Where to get it | Example shape |
| --- | --- | --- |
| `ascAppId` (iOS, both submit profiles) | App Store Connect → your app → **App Information → Apple ID** (a number) | `6501234567` |
| `appleTeamId` (iOS, both submit profiles) | developer.apple.com → **Membership** → Team ID | `A1BCDE2FG3` |
| `serviceAccountKeyPath` (Android) | Play Console → **Setup → API access** → create a service account in Google Cloud, grant it release permissions, download the JSON → save to `apps/mobile/credentials/play-service-account.json` | (a file path; the file is gitignored) |

And confirm these **match** what you typed into the stores (from §0):
- App Store Connect **Bundle ID** = `com.bedtimequests.app`
- Play Console **package name** = `com.bedtimequests.app`
- Both **App name / title** = `Bedtime Quests`
- Expo `owner` + `extra.eas.projectId` (written by `eas init`).

---

## 7. What's BLOCKED on you vs DONE in-repo now

**Done in the repo already (this change, #58):**
- Final **iOS bundle identifier** and **Android package** set to `com.bedtimequests.app`.
- App display name `Bedtime Quests`, stable Expo slug `bedtime-quests`, deep-link scheme
  `bedtimequests`.
- `eas.json` with `development` / `preview` / `production` build profiles and `internal` /
  `production` submit profiles, referencing EAS-managed credentials and a gitignored Play
  key path (no secrets committed).
- `credentials/` gitignored so the Play service-account JSON can never be committed.
- This guide.

**Blocked on you (requires your legal identity / payment — cannot be automated):**
- Enrolling in the **Apple Developer Program** ($99/yr) and completing identity verification.
- (Org route) obtaining a **D-U-N-S number** — start this first; it's the long pole.
- Registering the **Google Play Console** ($25) and completing developer verification.
- Reserving the **Bedtime Quests** name and creating the two **app records** with the exact
  IDs in §0.
- Recruiting **12 testers for 14 days** if you use a **personal** Play account (else prod is
  blocked regardless of the build being ready).
- Running `eas login` / `eas init` (needs your Expo account) and pasting the `ascAppId`,
  `appleTeamId`, and Play service-account key back per §6.
- Kids-category / Data-safety / privacy questionnaires (#62/#63/#64) and the privacy policy
  URL (#49).

---

## Sources

- [Apple — Become a member](https://developer.apple.com/programs/enroll/) ·
  [Choosing a membership](https://developer.apple.com/support/compare-memberships/) ·
  [Program enrollment help](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Google — App testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Expo — Configure EAS Build with eas.json](https://docs.expo.dev/build/eas-json/) ·
  [Automate submissions](https://docs.expo.dev/build/automate-submissions/)
