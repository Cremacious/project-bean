# Store privacy declarations for Bedtime Quests

> **Draft for review. Not legal advice.** This document translates what the app
> actually collects, uses, and shares (verified against the code, not the
> marketing copy) into the answers you enter in **Apple's App Privacy**
> questionnaire (App Store Connect) and **Google Play's Data Safety** form. Kids'
> apps are pulled or rejected for declarations that do not match real behavior,
> so every answer below cites the file it is grounded in. Have counsel confirm
> before you submit. Fill the open flags in section 5 first.

**Product:** Bedtime Quests (repo codename `project-bean`)
**Audience:** child directed (assume every reader may be under 13); COPPA applies.
**Grounded against (code, as of issue #62):**
`db/schema.ts`, `lib/auth.ts`, `lib/apple-client-secret.ts`, `lib/analytics.ts`,
`lib/ads.ts`, `lib/reporting.ts`, `packages/core/src/pii-keys.ts`,
`packages/core/src/consent.ts`, `lib/revenuecat.ts`,
`app/api/revenuecat/webhook/route.ts`, `apps/mobile/src/data/store.tsx`,
`apps/mobile/src/billing/revenueCatProvider.ts`,
`apps/mobile/src/notifications/mockProvider.ts`.
**Cross checked against:** the COPPA review (`docs/COMPLIANCE-COPPA.md`, issue
#31), the published Privacy Policy (`app/privacy/page.tsx` + the draft
`docs/legal/privacy-policy.md`, issue #49).

---

## 0. What the app actually does with data (the ground truth)

Everything in sections 1 and 2 derives from this. Read this first.

### 0a. Data the app stores (server, Neon Postgres)

| Data | Column / source | About whom | Why | Linked to account? |
| --- | --- | --- | --- | --- |
| First name | `child.name` (`db/schema.ts:56`) | **Child** | Personalize story text (the `{{name}}` token) | Yes (under parent) |
| Reading prefs | `child.readingMode/readerFont/readerFontSize` | Child | How the story is displayed | Yes |
| Story progress | `ending_found` (child id, story id, page id, time) | Child | Show discovered endings | Yes |
| Name | `user.name` | **Parent** | Account display / greeting | Yes |
| Email | `user.email` | Parent | Login id, password reset | Yes |
| Password hash | `account.password` | Parent | Auth (email/password); never a raw password | Yes |
| Social login token | `account.accessToken/idToken/...` | Parent | Google / Apple sign in | Yes |
| Profile image URL | `user.image` | Parent | Only if a social provider returns one | Yes |
| Session IP + user agent | `session.ipAddress`, `session.userAgent` | Parent | Keep signed in, security, rate limiting | Yes |
| Subscription entitlement | `subscription` (one row per parent) | Parent | Premium gating; RevenueCat `app_user_id` = the parent's own `user.id`, never a child | Yes (parent only) |

The app **never** stores a child's last name, birthdate, age, gender/pronouns,
photo, voice, location, email, phone, or any free text the child types
(`db/schema.ts` has no such columns; `docs/COMPLIANCE-COPPA.md` §2a).

### 0b. The privacy guarantee that shapes every "tracking" answer

The child's first name (and any other personal field) is **never** transmitted
to analytics, ads, or error reporting. This is enforced in code, not by
convention:

- **Analytics** (`lib/analytics.ts`): a closed, non-personal event taxonomy
  (`AnalyticsEvent`); every param passes `sanitizeParams()`, which drops any
  personal-looking key (`isPersonalKey`, `packages/core/src/pii-keys.ts` denylist
  includes `name`, `child`, `email`, `user`, `ip`, ...) and any non-primitive
  value. GA4 runs with ad signals off; no user id is ever sent.
- **Ads** (`lib/ads.ts`): default network is `house` (self promo, zero third
  party, no identifiers). Any real network is contextual / child-directed only,
  no child profile shared.
- **Error reporting** (`lib/reporting.ts`): Sentry runs `sendDefaultPii: false`,
  no tracing, **no Session Replay** (replay would capture the on-screen name);
  every event passes `scrubEvent()` which strips personal keys, request bodies,
  cookies, query strings, credential headers, and email-shaped strings.

### 0c. Everything third-party is env-gated and consent-gated, and OFF by default

- Analytics is off unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set; ads are off
  unless `ADS_ENABLED` is on **and** a network is ready; Sentry is off unless
  `NEXT_PUBLIC_SENTRY_DSN` is set. Local dev, CI, and an unconfigured build make
  **no** third-party network calls.
- Analytics and advertising additionally require the parent's **opt-in consent**
  (`packages/core/src/consent.ts`): both optional categories default **OFF** and
  stay off until the parent accepts. Only strictly necessary auth/session runs
  without consent.
- Ads are shown to **free-tier parents only**; subscribers and trial users load
  no ad code at all.

### 0d. The native app (Expo, `apps/mobile`) collects even less

The native app currently wires **only** RevenueCat billing and **local** bedtime
reminders. It has **no** analytics, **no** ads, and **no** crash reporting SDK
(verified: no analytics/Sentry/ads imports in `apps/mobile/src`). Bedtime
reminders are scheduled **on device**; `getPushToken()` returns `null` and no
push token or reminder content leaves the device
(`apps/mobile/src/notifications/mockProvider.ts`; permission stays
`undetermined` until the parent opts in, issue #56). The RevenueCat `appUserId`
is the parent account id only (`apps/mobile/src/billing/revenueCatProvider.ts`
§configure/logIn; `apps/mobile/src/data/store.tsx` `parentAppUserId`).

---

## 1. Apple App Privacy (App Store Connect)

For each of Apple's data types: is it **collected**, for what **purpose(s)**, is
it **linked to the user's identity**, and is it used to **track** (Apple's
definition: linking with third-party data for advertising, or sharing with a data
broker). For a correctly configured child-directed app, **Tracking = No for
every type.**

### 1a. Data types we DO collect

| Apple data type | Collected | Purpose(s) | Linked to user | Used for Tracking |
| --- | --- | --- | --- | --- |
| **Contact Info → Name** (parent name; child first name — see note) | Yes | App Functionality; personalization | **Linked** | **No** |
| **Contact Info → Email Address** (parent email) | Yes | App Functionality; account management | Linked | No |
| **Identifiers → User ID** (parent account id; also the RevenueCat `app_user_id`) | Yes | App Functionality; purchase entitlement | Linked | No |
| **Purchases → Purchase History** (subscription state via RevenueCat + App Store) | Yes | App Functionality (manage subscription) | Linked | No |
| **Usage Data → Product Interaction** (analytics events; **only if GA enabled + parent consent**) | Conditional | Analytics; App Functionality | **Not linked** (non-personal events, no user id) | No |
| **Diagnostics → Crash Data / Performance Data** (Sentry; **only if DSN set**) | Conditional | App Functionality; diagnostics | Not linked (PII scrubbed) | No |

**Note on the child's first name.** Apple has no "child name" bucket. The child's
first name is personal data you store, so declare it — the defensible mapping is
**Contact Info → Name** (or "Other User Content" if you prefer the User Content
family; pick one and match the Privacy Policy). It is **Linked** (tied to the
parent account) and **not** used for tracking. Do **not** mark it under any
advertising purpose.

**Purpose mapping** (Apple's fixed purpose list): parent name/email, user id,
purchases → **App Functionality** (+ Account Management where offered).
Analytics events → **Analytics**. Crash/diagnostics → **App Functionality** (and
Analytics if you use Sentry data to understand usage; we do not — diagnostics
only). **No** data is mapped to **Third-Party Advertising**, **Developer's
Advertising**, or **Product Personalization for ads**.

### 1b. Data types we do NOT collect (declare "Not Collected")

Health & Fitness; Financial Info (**no card / payment data** — the App Store
handles payment, we never see a card number); Precise or Coarse **Location**;
Sensitive Info; **Contacts**; **Photos/Videos**; **Audio/voice**; Browsing
History; Search History; **Device ID / IDFA** (the `house` ad default sets no
device identifier; see flag F3); Advertising Data; Emails or text messages;
Gameplay content beyond the progress noted; any other data type.

### 1c. Tracking / App Tracking Transparency (ATT)

- Answer **"No, we do not track."** Tracking would require linking user data with
  third-party data for advertising or sharing with a data broker. Ads are
  **contextual only**, no cross-app/cross-service identifier is created or shared,
  and no child profile is built (`lib/ads.ts`, `docs/COMPLIANCE-COPPA.md` §6a).
- Because we do not track, **no ATT prompt** and **no IDFA access** should ship.
  Confirm the ad SDK, once wired, does not request IDFA (flag F3).

### 1d. Kids Category implications (read before choosing a category)

If you list Bedtime Quests in the **Apple Kids Category**, Apple's guideline
**1.3 / 5.1.4** applies: apps in the Kids Category **must not** send personal
information or device data to third parties, and **may not include third-party
analytics or third-party advertising** except where it meets Apple's limited,
contextual, human-reviewed exceptions for kids. Consequences:

- **RevenueCat** (subscription management) is generally acceptable as a service
  provider that receives only parent-scoped, non-child purchase data.
- **Third-party analytics (GA4)** and **third-party ads** are the risk. If you
  enroll in the Kids Category, you likely must ship with GA **off** and ads
  either **off** or restricted to the `house` (no third party) path, or use only
  an Apple-accepted kids ad solution. This is a **product decision** (flag F1).
- All third-party SDKs must be in modes that **do not track children**; keep the
  env-gated / consent-gated defaults exactly as coded.

---

## 2. Google Play Data Safety

Play asks, per data type: is it **collected**, is it **shared** (transferred to a
third party), is collection **optional**, the **purposes**, whether it is
**processed ephemerally**, and whether it is **required**. Plus app-level
questions: **encryption in transit**, a **deletion path**, and the **Families /
child-directed** questions.

### 2a. App-level answers

- **Is all data encrypted in transit?** **Yes.** HTTPS/TLS in production; Apple
  sign-in requires HTTPS return URLs (`lib/auth.ts`); Neon connections are
  encrypted. (`docs/COMPLIANCE-COPPA.md` §7, Privacy Policy §10.)
- **Do you provide a way to request data deletion?** **Yes.** Parents can delete
  their whole account in-app (`lib/auth.ts` `deleteUser`), which **cascades** to
  the child rows and `ending_found` (`db/schema.ts` `onDelete: "cascade"`); they
  can delete a single child profile; and they can email support. Provide the
  deletion URL/instructions in the form (Privacy Policy §8, §9).
- **Committed to Play Families Policy:** **Yes** (child-directed app).

### 2b. Data collected / shared

"Shared" on Play = transferred to a third party. Our infrastructure vendors
(Neon, Resend, the host) act as **processors on our behalf** and are **collected,
not shared**. RevenueCat, an ad network, GA, and Sentry are third-party SDKs;
see section 3 for the per-SDK "shared?" call.

| Play data type | Collected | Shared | Optional? | Purpose(s) | Ephemeral? |
| --- | --- | --- | --- | --- | --- |
| **Personal info → Name** (parent name; child first name) | Yes | No | Required | App functionality; personalization | No |
| **Personal info → Email address** (parent) | Yes | No | Required | App functionality; account management | No |
| **Personal info → User IDs** (parent account id) | Yes | See §3 (RevenueCat) | Required | App functionality; subscription | No |
| **Financial info → Purchase history** (subscription status) | Yes | See §3 (RevenueCat) | Optional (only if they subscribe) | App functionality | No |
| **App activity → App interactions** (analytics events; only if GA on + consent) | Conditional | See §3 (GA) | **Optional (consent)** | Analytics | No |
| **App info & performance → Crash logs** (Sentry; only if DSN) | Conditional | See §3 (Sentry) | Optional | App functionality; diagnostics | No |
| **App info & performance → Diagnostics** (Sentry performance; only if DSN) | Conditional | See §3 | Optional | App functionality; diagnostics | No |
| **Device or other IDs** (only if a real ad network is wired; `house` sets none) | **No today** (flag F3) | See §3 (ads) | Optional (consent) | — | — |

**Not collected on Play:** Location; Financial → payment info/credit card (store
handles payment); Health & fitness; Messages; Photos & videos; Audio files/voice;
Files & docs; Calendar; Contacts; Web browsing history; Installed apps.

### 2c. "Is this data used to track users / for ads?" (Play)

- **No behavioral/interest-based advertising.** Ads (if enabled) are contextual
  only, child-directed treatment, no ad personalization (`lib/ads.ts`).
- Analytics is **not** used for advertising or to build cross-service profiles;
  ad signals and Google Signals are off (`lib/analytics.ts`).
- No data type is collected "for advertising or marketing" or "for fraud
  prevention via a third-party profile." Purposes stay App functionality /
  Analytics / Account management only.

---

## 3. Per-SDK table (what each third party touches, and the child-safe setting)

| SDK | What it receives | Why | "Shared" on Play? | Setting that keeps it child-safe | Ships enabled at submission? |
| --- | --- | --- | --- | --- | --- |
| **RevenueCat** (`lib/revenuecat.ts`, `apps/mobile/.../revenueCatProvider.ts`) | Parent-scoped `app_user_id` (= `user.id`), product id, purchase receipt/expiry | Manage subscription entitlement | Treat as **collected via processor** for subscription; disclose as a processor | `app_user_id` is the **parent** id only — never a child name/id/attribute (`docs/COMPLIANCE-COPPA.md` §6c; enforced in code) | Native: yes if a public key is set, else mock. Web: only via signed webhook. |
| **Ad network** (`lib/ads.ts`; default `house`, planned SuperAwesome / Google Ad Manager) | `house`: nothing (no third party). Real network: contextual request context only | Show contextual ads to free-tier parents | If a real network is enabled, this is the one genuine **shared-for-third-party** entry; declare it and its `Device or other IDs` if it sets one | Child-directed / TFCD flag, **contextual only, no behavioral ads, no child data**, consent-gated, free-tier only (flag F1/F3) | **No** — default `house`, no third-party ad ships unless configured |
| **Google Analytics 4** (`lib/analytics.ts`) | Only the closed non-personal event set + non-personal params (post-`sanitizeParams`); **no** name/email/user id | Aggregate product measurement | Disclose as **App interactions / Analytics**; processor-style, no ad use | Ad signals off, Google Signals off, IP anonymization, no user id, consent-gated; off unless measurement id set | **No** — off unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` set (flag F1/F2) |
| **Sentry** (`lib/reporting.ts`) | Scrubbed crash/diagnostic events; PII off, bodies/cookies/query/emails stripped, no replay | Crash + error diagnostics | Disclose as **Crash logs / Diagnostics**; processor | `sendDefaultPii: false`, `scrubEvent` beforeSend, no Session Replay, no tracing; off unless DSN set | **No** — off unless `NEXT_PUBLIC_SENTRY_DSN` set (flag F2) |
| **Google / Apple sign-in** (`lib/auth.ts`, `lib/apple-client-secret.ts`) | Standard OAuth: we receive the provider token, and possibly the parent's name/email/profile image | Parent account login | Login with the parent's provider; **not** tracking, no child data | Provider only used for the **parent**; child never authenticates; only activated when provider credentials are present | Only if `GOOGLE_*` / `APPLE_*` env is set |

---

## 4. Consistency check vs Privacy Policy (#49) and COPPA review (#31)

**Consistent — the declarations match on every material point:**

- Child data limited to first name + reading prefs + progress; no last name,
  age, birthdate, photo, voice, location, contact info. (Privacy Policy §2/§3a;
  COPPA §2a; `db/schema.ts`.) ✅
- Parent data = name, email, hashed password or social token, session IP/UA,
  optional profile image. (Privacy Policy §3b; COPPA §2b.) ✅
- No card/payment data stored; subscriptions via the app stores + RevenueCat,
  tied to the adult account, never the child. (Privacy Policy §3c; COPPA §6c.) ✅
- Contextual-only ads, no behavioral/interest-based ads to children, child's
  name/profile never shared with the ad network. (Privacy Policy §5; COPPA
  §6a.) ✅
- Analytics child-directed, ad features off, name never sent. (Privacy Policy
  §6; COPPA §6b.) ✅
- Deletion: account delete cascades; per-child delete; email support. Encryption
  in transit; rate-limited auth. (Privacy Policy §8–§10; COPPA §5/§7.) ✅
- Child name never sent to analytics/ads/error reporting. (COPPA §6; enforced in
  `pii-keys.ts` / `sanitizeParams` / `scrubEvent`.) ✅

**Discrepancies / gaps to fix before submitting (not contradictions in behavior,
but things the store forms need that the policy has not yet pinned down):**

- **D1 — Unfilled legal placeholders.** `lib/legal.ts` still has bracket tokens:
  `[SUPPORT EMAIL]`, `[COMPANY NAME]`, `[COMPANY ADDRESS]`, `[AD NETWORK NAME]`,
  `[ANALYTICS PROVIDER]`, `[EFFECTIVE DATE]`. The store forms require a live
  **privacy policy URL** and a **support/data-deletion contact**. Fill these and
  publish before submission.
- **D2 — "If enabled" language.** The Privacy Policy describes ads and analytics
  conditionally ("if we show ads"). The store forms must reflect the **exact
  config you ship at submission**. If you submit with GA/ads/Sentry **off**
  (the defaults), declare the *conditional* rows accordingly and revisit the
  declaration if you later turn any on (a Data Safety change requires a resubmit;
  Apple labels update with the next version).
- **D3 — Name your providers.** Once `[AD NETWORK NAME]` and
  `[ANALYTICS PROVIDER]` are chosen, ensure the SDK actually used matches what
  this doc and the policy name (GA4 and the chosen ad network), so the "shared
  with" list is exact.

---

## 5. Flags to resolve BEFORE you submit (decisions / possible code changes)

- **F1 — Apple Kids Category + third-party analytics/ads (decision).** Decide
  whether to enroll in the Kids Category. If yes, plan to ship with **GA off**
  and ads restricted to `house` (or an Apple-accepted kids solution), because
  Kids Category forbids third-party analytics/ads outside narrow exceptions
  (§1d). This changes what you declare. *Your call.*
- **F2 — What is actually enabled at submission (decision).** Confirm which of
  GA (`NEXT_PUBLIC_GA_MEASUREMENT_ID`), Sentry (`NEXT_PUBLIC_SENTRY_DSN`), and
  ads (`ADS_ENABLED` + network) will be **on** in the store build. The
  conditional rows in §1–§3 must be answered as they actually ship. Recommended
  first submission: **all three off** (matches the safe defaults), fewest
  declarations, easiest kids review.
- **F3 — Advertising ID / IDFA (verify before any ad network goes live).** Today
  `house` sets no device identifier and no IDFA/AAID is requested. Before wiring
  SuperAwesome or Google Ad Manager, confirm the SDK runs in child-directed mode
  **without** requesting IDFA/AAID; if it accesses an advertising ID you must add
  `Device or other IDs` to both forms and reconsider the "No tracking" answer.
  Do not enable an ad network for the kids build until this is verified.
- **F4 — RevenueCat "shared vs collected" (confirm).** We treat RevenueCat as a
  processor (collected, not shared). Confirm this framing with counsel and that
  RevenueCat's DPA supports it; it only ever receives the parent-scoped
  `app_user_id` and purchase data, never child data.
- **F5 — Deletion contact must be live (fix).** The Play Data Safety deletion
  question and Apple's account-deletion requirement need a working
  support/deletion email and, ideally, a self-serve in-app path surfaced behind
  the parental gate (#32). Blocked on D1 (`[SUPPORT EMAIL]`).

---

## 6. One-screen summary of key answers

**Apple:** Collected & **Linked, not Tracking** → parent Name, parent Email,
User ID, Purchase History. **Not Linked, not Tracking** → Product Interaction
(analytics, if on), Crash/Diagnostics (if on). Child first name → declare under
**Name / User Content**, Linked, not Tracking. **Everything else Not Collected.**
**Tracking = No; no ATT prompt; no IDFA.** Kids Category → likely GA off + ads
`house`-only (F1).

**Google Play:** Encrypted in transit **Yes**; deletion path **Yes** (account
cascade + per-child + email); Families policy **Yes**. Collected: Name, Email,
User IDs, Purchase history (all "collected, not shared"); App interactions +
Crash/Diagnostics conditionally, consent-gated. **No** data used for
tracking/ads. Ad network is the only potential "shared for third party" entry and
does not ship by default.

**Blocking before submit:** fill `lib/legal.ts` placeholders + publish the policy
(D1/F5), decide Kids Category (F1), lock which SDKs ship on (F2), verify no IDFA
(F3).
