# Store guidelines compliance pass — Bedtime Quests (issue #64)

> **Draft for review. Not legal advice.** This is a pre submission verification pass:
> the real app behavior (web + native) audited against Apple's App Review Guidelines
> for the **Kids Category**, Google Play's **Families / Designed for Families**
> policy, and the common **subscription** rejection triggers. Every line is marked
> **PASS**, **GAP**, or **DECIDE** and cites the file that grounds it. Fix the GAPs
> and settle the DECIDEs in section 6 before you submit. Have counsel confirm the
> privacy and consent posture.

**Product:** Bedtime Quests (repo codename `project-bean`)
**Audience:** child directed (assume every reader may be under 13); COPPA applies.
**Pass date:** July 14, 2026.
**Grounded against (code, verified this pass):**
`components/parental-gate/*`, `app/sign-up/page.tsx`, `components/auth/social-buttons.tsx`,
`components/paywall.tsx`, `components/subscribe/plan-selection.tsx`,
`apps/mobile/src/screens/PaywallScreen.tsx`, `apps/mobile/src/screens/ParentalGate.tsx`,
`apps/mobile/src/screens/SettingsScreen.tsx`, `lib/ads.ts`, `lib/analytics.ts`,
`lib/reporting.ts`, `components/consent/consent-provider.tsx`, `lib/legal.ts`,
`lib/auth.ts`, `components/account/delete-account.tsx`,
`components/profiles/child-row.tsx`, `components/app-header.tsx`,
`apps/mobile/app.json`.
**Cross checked against:** `docs/COMPLIANCE-COPPA.md` (#31),
`docs/store/privacy-declarations.md` (#62), `docs/store/content-ratings.md` (#63),
`docs/store/google-play-listing.md` (#61), `docs/legal/*` and the live
`/privacy` `/terms` `/support` routes (#49), `docs/TESTFLIGHT-PLAY-TESTING.md` (#59),
`docs/WORKFLOW.md` (the three UI rules).

---

## 0. One screen verdict

The privacy, ads, analytics, and data minimization posture is **strong and matches
the declarations** in #62/#63. The parental gate, restore purchases, in app account
deletion, and Sign in with Apple are all present and correct. Nothing here is a
behavioral contradiction that would surprise a reviewer.

**Five things stood between the app and a clean review. GAP 2, 3, and 4 are now fixed
in this pass (section 7); GAP 1 and 5 remain and are yours to close.**

| # | Severity | What | Status |
| --- | --- | --- | --- |
| **GAP 1** | **Blocking** | Legal placeholders unfilled: no live privacy policy URL, no support / data deletion contact (`lib/legal.ts`) | **OPEN** (needs LAWYER + mailbox) |
| **GAP 2** | **High (Apple 3.1.2)** | Native paywall showed "Terms of Service and Privacy Policy" as plain text, not functional links | **FIXED** — now tappable links to the live web pages (`PaywallScreen.tsx`) |
| **GAP 3** | **High (Apple 3.1.2 / Play)** | Point of sale did not state the subscription **auto renews** | **FIXED** — auto renew line added on web + native point of sale |
| **GAP 4** | **Medium** | Web account settings / family were not behind the parental gate the app's own COPPA §4 requires | **FIXED** — `/family` and `/account` entry now gated (`app-header.tsx`) |
| **GAP 5** | **Process** | The store build ships the **billing mock** unless `prepare:device-build` is run; the reviewer must reach a **real** purchase and needs demo credentials + review notes | **OPEN** (build + notes; draft notes in Appendix A) |

Plus the DECIDEs already tracked in #62/#63 (Kids Category, target age bands, which
SDKs ship on, IDFA) restated in section 6.

---

## 1. Apple — Kids Category requirements

Apple guideline **1.3** (Kids Category) and **5.1.4** (Kids apps / privacy): no
behavioral advertising, no third party analytics that tracks kids, ads must be human
reviewed and age appropriate, a parental gate before commercial actions and before
leaving the app, no PII from kids without verifiable parental consent, and a privacy
policy.

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 1.1 | **No third party behavioral advertising.** | **PASS** (with DECIDE) | Default ad path is `house` (self promo, zero third party, no identifiers); any real network is contextual / child directed only and does not ship by default (`lib/ads.ts:1-121`). Ships with ads off unless `ADS_ENABLED` + a ready network. Kids Category means keep GA off + ads `house` only (DECIDE C2/F1). |
| 1.2 | **No third party analytics that tracks children.** | **PASS** | GA4 is off unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, ad signals + Google Signals off, no user id, consent gated, PII scrubbed (`lib/analytics.ts:110-203`). Native app has **no** analytics SDK at all (`apps/mobile` has no analytics import; #62 §0d). |
| 1.3 | **Ads, if any, are age appropriate / non personalized.** | **PASS** | `house` ads are first party self promo; contextual only, free tier only, never shown to subscribers or trial users (`lib/ads.ts:105-121`, `shouldShowAds`). |
| 1.4 | **Ads absent for subscribers.** | **PASS** | `shouldShowAds` returns false whenever `subscription.isActive`, and subscriber pages emit no ad code (`lib/ads.ts:114-121`). |
| 1.5 | **Parental gate before purchases / commercial actions.** | **PASS** | Web paywall and plan picker both `await requireAdult("purchase")` before any checkout (`components/paywall.tsx:29`, `components/subscribe/plan-selection.tsx:59`). Native paywall opens the gate before the plan picker (`PaywallScreen.tsx:320,336-343`). Gate is a spell the numbers challenge, re challenges on wrong answer, fresh each open (`parental-gate-dialog.tsx`, `ParentalGate.tsx`). |
| 1.6 | **Parental gate before leaving the app / external links.** | **PASS** | No kid facing surface links out to the web. Web legal links are same origin routes, not "leaving the app". The **only** native `Linking` call is `Linking.openSettings()` for the OS notification screen, itself already behind the settings gate (`SettingsScreen.tsx:140`). No arbitrary web navigation exists (#63 §1f, Unrestricted Web Access = No). |
| 1.7 | **Parental gate before account settings / data controls.** | **FIXED (GAP 4)** | The header menu now routes the **Family** and **Account settings** entries through `openBehindGate`, which runs `requireAdult("settings")` before navigating (`components/app-header.tsx`). A child can no longer wander into per child delete, account delete, or billing. Matches `docs/COMPLIANCE-COPPA.md` §4 and #32's scope. |
| 1.8 | **No PII from a child without verifiable parental consent.** | **PASS / LAWYER** | The child never types into any form; the **parent** enters the child's first name from an authenticated adult account, and that is the only child identifier stored (`db/schema.ts`, COPPA §2a). VPC method itself is a LAWYER item (COPPA §9 Q1), unchanged by this pass. |
| 1.9 | **Data minimization for kids.** | **PASS** | Child data is first name + reading prefs + story progress only; no age, birthdate, photo, voice, location, contact info (COPPA §2a; #62 §0a). |
| 1.10 | **Privacy policy present and reachable.** | **GAP 1** | Routes `/privacy` `/terms` `/support` exist and are linked at the web point of sale and sign up (`paywall.tsx:94-106`, `sign-up/page.tsx:150-162`), **but** `lib/legal.ts` still holds `[SUPPORT EMAIL]`, `[COMPANY NAME]`, `[COMPANY ADDRESS]`, `[EFFECTIVE DATE]`, `[AD NETWORK NAME]`, `[ANALYTICS PROVIDER]` etc. (`lib/legal.ts:20-28`). The policy is not legally live and has no working contact until these are filled. |
| 1.11 | **Sign in with Apple offered (guideline 4.8).** | **PASS** | Apple is offered alongside Google on both auth surfaces (`components/auth/social-buttons.tsx:34-35`); Apple client secret support is wired (`lib/apple-client-secret.ts`). |
| 1.12 | **In app account deletion (guideline 5.1.1(v)).** | **PASS** | `deleteUser({ password })` re authenticates then deletes; the delete cascades to child rows and `ending_found` (`components/account/delete-account.tsx:38`, `lib/auth.ts`, COPPA §5). |
| 1.13 | **No tracking / ATT / IDFA.** | **PASS (verify F3)** | No IDFA is requested today; "No tracking", no ATT prompt is the correct answer for the current config (#62 §1c). Re verify if a real ad network is ever wired (DECIDE F3). |

---

## 2. Google Play — Families / Designed for Families policy

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 2.1 | **Target audience & content set for children.** | **DECIDE C1** | Content spans toddlers to early readers; recommended bands **Ages 5 and under + Ages 6 to 8** (#63 §4b C1). Must be selected in Play Console → Target audience and content. |
| 2.2 | **Committed to the Families policy.** | **PASS (declare)** | App is child directed and designed for it; opt in to Designed for Families = Yes (#61 D2, #62 §2a). |
| 2.3 | **Ads comply with the Families ads program (certified network, non personalized, format rules).** | **PASS (with DECIDE)** | Ships with **no third party ad network** (`house` default, `lib/ads.ts`). If one is later enabled it must be a Families self certified network in child directed / non personalized mode (DECIDE F1/F3). No interstitials or disallowed formats today. |
| 2.4 | **No behavioral / interest based ads to children.** | **PASS** | Contextual only, no identifiers, child's name/profile never shared (`lib/ads.ts:1-121`, COPPA §6a). |
| 2.5 | **Data Safety form accurate (#62).** | **PASS (matches)** | Verified: child data = first name + prefs + progress, no location, no card data, encryption in transit, deletion path present; consistent with #62 §2 and the code. Fill the form to match the **exact** SDKs shipped on (DECIDE F2). |
| 2.6 | **Content rating accurate (#63).** | **PASS** | IARC answers (all content topics None; Users Interact No; Digital Purchases Yes; Contains Ads Yes) match the app; expected lowest bands (ESRB Everyone / PEGI 3) (#63 §2). |
| 2.7 | **No disallowed permissions / APIs.** | **PASS** | `apps/mobile/app.json` declares **no** dangerous permissions and **no** advertising ID. Only local notifications are used (added per device build), which is allowed. Declare **"does not use an advertising ID"** in Data Safety, since no ads SDK ships (`app.json`, #62 §0d). |
| 2.8 | **Privacy policy linked in Play Console.** | **GAP 1** | The URL (`https://bedtimequests.com/privacy`) is ready to paste, but blocked by the same unfilled `lib/legal.ts` placeholders and the mailbox not yet created (#61 §1). |
| 2.9 | **Data deletion path (Data Safety).** | **PASS / GAP 1** | In app account delete cascades + per child delete both exist (`delete-account.tsx`, `child-row.tsx`); the **email** deletion channel needs the real support address (blocked on GAP 1 / `[SUPPORT EMAIL]`). |
| 2.10 | **No user to user contact / UGC / location sharing.** | **PASS** | No chat, no UGC, no location anywhere (`db/schema.ts`, #63 §2 X1/X3). |

---

## 3. Subscription rejection triggers (Apple 3.1.1 / 3.1.2, Play billing)

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 3.1 | **Price + billing period disclosed at point of sale.** | **PASS** | Native shows "{trial} day free trial, then {price} a {period}" from the live store offering (`PaywallScreen.tsx:258-262`); web shows the same from core (`plan-selection.tsx:136-139`). |
| 3.2 | **Free trial length disclosed.** | **PASS** | `TRIAL_DAYS` (7) shown on the CTA and summary on both surfaces (`PaywallScreen.tsx:251,260`, `plan-selection.tsx:110,133`). |
| 3.3 | **Auto renew clearly disclosed at point of sale.** | **FIXED (GAP 3)** | The point of sale summary on web and native now reads *"{n} day free trial, then {price} a {period}. Your subscription renews automatically until you cancel, and you can cancel anytime."* (`plan-selection.tsx`, `PaywallScreen.tsx` plans step). Dash free. The full store description still carries the "cancel at least 24 hours before renewal" wording (#61). |
| 3.4 | **Functional links to Terms of Use (EULA) and Privacy Policy at point of sale.** | **PASS (web) / FIXED (native, GAP 2)** | Web paywall and sign up render real `<Link>`s to `/terms` and `/privacy` (`paywall.tsx:94-106`, `sign-up/page.tsx:150-162`). Native now renders a shared `LegalConsentLine` with tappable links that open `https://bedtimequests.com/terms` / `/privacy` via `Linking.openURL`, on **both** the value screen and the plan picker (`PaywallScreen.tsx`). Required legal links are the accepted exception to the kids external link gate, so they are not themselves gated. **Depends on GAP 1** (the domain + policy must be live for the links to resolve). |
| 3.5 | **Restore purchases available.** | **PASS** | Native paywall offers "Restore a purchase" on both the value and plans screens, with warm outcomes for restored / none / error (`PaywallScreen.tsx:102-127, 271-277, 324-330`). Restore action seam is `restorePurchases()` (`apps/mobile/src/billing`). |
| 3.6 | **No dark patterns (clear decline, no pre checked upsell, honest "nothing charged").** | **PASS** | Every flow has a clear "Go back" / "Back to the free stories"; the gate has a plain cancel; the web deferral and native preview both state "Nothing was charged" (`plan-selection.tsx:248`, `PaywallScreen.tsx:145-151,170-172`). No coercive copy. |
| 3.7 | **Working purchase for the reviewer.** | **GAP 5** | The store build defaults to the **billing mock**; real StoreKit / Play Billing requires `npm run prepare:device-build` (kept off master's lockfile) per `docs/TESTFLIGHT-PLAY-TESTING.md`. If the submitted binary runs the mock, the reviewer cannot complete a real purchase and StoreKit/Play products will not be validated. **Fix / confirm:** the submitted build uses the real RevenueCat provider with store products, and provide sandbox test steps. |
| 3.8 | **Reviewer demo account + review notes.** | **DECIDE** | Provide a test **parent** account (email/password) so the reviewer can sign in, plus a note explaining: name only child personalization, the parental gate challenge, that web subscriptions intentionally **defer to the native app**, and sandbox purchase steps. Not yet written down. |
| 3.9 | **Web "purchase" does not fake entitlement.** | **PASS** | Web `startSubscription` never grants entitlement; it hands off to the native app and the RevenueCat webhook reports the real trial/purchase (`plan-selection.tsx:68-95,226-269`). Avoids the "web unlocks premium outside IAP" (3.1.1) problem. |

---

## 4. UI rule + accessibility sanity (relevant to review)

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 4.1 | **Legibility / high contrast (UI rule 3).** | **PASS** | Ink on white / navy tokens throughout the gate, paywall, plans; no faint text observed in the audited flows (`parental-gate-dialog.tsx`, `paywall.tsx`, `plan-selection.tsx`). |
| 4.2 | **Every clickable element looks clickable (UI rule 2).** | **PASS** | Paper Cut buttons with solid bottom edge + `active:translate-y-0.5` + `focus-visible` ring + `cursor-pointer` on every CTA and card (`paywall.tsx:80-84`, `plan-selection.tsx:127-134,181-190`). Native uses `PaperButton` / `PressableCard` equivalents. |
| 4.3 | **No dashes in displayed copy (UI rule 1).** | **PASS** | Audited copy in the gate, paywall, plans, settings is dash free ("Cancel anytime", "Grown ups only", "game over" only as an internal enum). |
| 4.4 | **Tap targets sized for young children / thumbs.** | **PASS** | CTAs are `min-h-[52px]`, secondary links `min-h-[44px]`, gate input `h-12` (`paywall.tsx:84,113`, `plan-selection.tsx:131,162`); native controls carry `hitSlop` / `minHeight: 44` (`SettingsScreen.tsx:239`). Meets the 44 px minimum. |
| 4.5 | **Gate is accessible (labelled modal, focus trap, Escape, restore focus).** | **PASS** | Web gate is a labelled `role="dialog" aria-modal`, traps Tab, Escape and backdrop cancel, restores focus, locks background scroll, announces the numbers via the field label (`parental-gate-dialog.tsx:47-100`). Native gate is a `Modal` with `accessibilityViewIsModal` and an accessible number label (`ParentalGate.tsx:48-69`). |
| 4.6 | **Consent controls (optional categories default OFF).** | **PASS** | Analytics + advertising categories default off and stay off until the parent accepts; withdrawal actively clears GA cookies and denies the gtag signal (`components/consent/consent-provider.tsx:135-155`, core `consent.ts`). |

---

## 5. What passed cleanly (summary)

- Parental gate: correct challenge, present before **every purchase** path and
  before **account settings / data controls** on web and native. Sign-up itself is
  intentionally not gated (account creation is not a store gate-required action).
- Ads: `house` default, contextual, free tier only, off for subscribers, off by
  default, no identifiers.
- Analytics: consent gated, PII scrubbed, off by default, no user id, ad signals off;
  **native has none**.
- Error reporting: Sentry `sendDefaultPii:false`, `scrubEvent`, no Session Replay, off
  by default; **native has none** (`lib/reporting.ts`, #62 §0b).
- Native app collects even less: only RevenueCat (parent scoped id) + on device
  reminders; no push token leaves the device.
- Data minimization: child first name only; no location, photo, voice, age, contact.
- Account deletion in app + cascade; per child deletion exists; Sign in with Apple
  offered; no disallowed Android permissions; no advertising ID.

---

## 6. Action register — resolve before submitting

### GAPs (fix these)

- **GAP 1 (Blocking) — Fill and publish the legal placeholders.** Replace every
  `[BRACKET]` token in `lib/legal.ts` (`supportEmail`, `companyName`, `companyAddress`,
  `effectiveDate`, `lastUpdated`, `governingLawRegion`, `courtsLocation`, and — once
  chosen — `adNetwork`, `analyticsProvider`), create and verify the
  `support@bedtimequests.com` mailbox, and confirm `bedtimequests.com/privacy`,
  `/terms`, `/support` are live. Both stores require a working privacy policy URL and a
  data deletion contact. *Blocked on a LAWYER pass (COPPA §9) and the mailbox.*
- **GAP 2 (Apple 3.1.2) — Native paywall Terms / Privacy now tappable. DONE.** A shared
  `LegalConsentLine` opens `https://bedtimequests.com/terms` and `/privacy` via
  `Linking.openURL` on both the value screen and the plan picker (`PaywallScreen.tsx`).
  **Still depends on GAP 1** for the links to resolve to a live, lawyer approved policy.
- **GAP 3 (Apple 3.1.2 / Play) — Auto renew stated at point of sale. DONE.** The summary
  on web (`plan-selection.tsx`) and native (`PaywallScreen.tsx` plans step) now reads
  "…then {price} a {period}. Your subscription renews automatically until you cancel, and
  you can cancel anytime." Dash free; no asserted test strings were affected.
- **GAP 4 (app's own COPPA §4) — Web settings gated. DONE.** The header **Family** and
  **Account settings** menu entries now run `requireAdult("settings")` before navigating
  (`components/app-header.tsx`, `openBehindGate`). I gated the **route entry** (the single
  choke point that also covers per child delete and account delete) rather than each
  destructive action; say so if you would prefer the per action gate instead.
- **GAP 5 (Process) — Ship a real purchase for the reviewer. OPEN (yours).** Confirm the
  submitted binary is built with `npm run prepare:device-build` so RevenueCat uses real
  store products (not the mock), per `docs/TESTFLIGHT-PLAY-TESTING.md`. Otherwise the
  reviewer cannot complete a purchase. Draft reviewer notes are in **Appendix A**.

### DECIDEs (your call before submitting)

- **C1 — Play target age bands.** Recommended: **Ages 5 and under + Ages 6 to 8** (#63 §4b).
- **C2 / F1 — Apple Kids Category.** Recommended: **enroll**, which means ship with **GA
  off and ads `house` only** (Apple 1.3 / 5.1.4). Same safe posture already planned (#63 §1h, #62 §5 F1).
- **F2 — Which SDKs ship on at submission.** Recommended first release: **GA, Sentry,
  and ads all off** (fewest declarations, cleanest kids review) (#62 §5 F2).
- **F3 — IDFA / advertising ID.** Verify **no** advertising ID is requested before any
  ad network is ever enabled; today none is (#62 §5 F3).
- **Reviewer notes (from GAP 5 / 3.8).** Decide the demo **parent** credentials and
  write review notes: name only personalization, the gate challenge answer format, the
  intentional web to native purchase deferral, and sandbox purchase steps.

---

## 7. Fixes made in this pass

Three small, in scope code fixes were applied (GAP 2, 3, 4). GAP 1 and GAP 5 are left
for you because they need a lawyer pass, a real mailbox, a live domain, and a device
build decision.

- **Native paywall legal links + shared `LegalConsentLine`** (`apps/mobile/src/screens/PaywallScreen.tsx`):
  added `Linking` import, a `LEGAL_URLS` constant, and a `LegalConsentLine` component with
  tappable Terms of Service / Privacy Policy links, shown on the value screen and the plan
  picker. (GAP 2)
- **Auto renew disclosure at point of sale** (`PaywallScreen.tsx` plans step summary,
  `components/subscribe/plan-selection.tsx` summary): both now state the subscription
  renews automatically until cancelled. (GAP 3)
- **Parental gate on web settings** (`components/app-header.tsx`): the Family and Account
  settings menu items now pass `requireAdult("settings")` before navigating. (GAP 4)

**Verification (all green):**
- `npm run test` → 32 files, **241 tests pass**.
- `npm run typecheck` (web + core) → clean.
- `apps/mobile` `npm run typecheck` (native / Expo) → clean.
- `eslint` on the changed web files → clean.

No test asserted the subscription copy or the header links, so no tests needed updating.

---

## Appendix A — Draft App Review notes + demo access (GAP 5 / item 3.8)

Paste into **App Store Connect → App Review Information → Notes** and **Play Console →
App content → App access / Testing instructions**. Replace the bracketed values.

**Demo account (required so the reviewer can sign in):**
- Email: `[REVIEW PARENT EMAIL]`
- Password: `[REVIEW PARENT PASSWORD]`
- This is a parent (adult) account. There is one child profile already added so stories
  and the collection are populated.

**How the app works (context for a child directed app):**
- Bedtime Quests is an interactive bedtime story app for young children, read aloud by a
  parent. Personalization is the child's **first name only**; we collect no other data
  about the child (no age, photo, voice, location, or contact info).
- **Parental gate:** creating an account, starting a purchase, and opening the parent
  settings (Family, Account) all require passing a "Grown ups only" gate that asks the
  adult to type three numbers spelled out as words (for example, the prompt "four, seven,
  two" is answered by typing `472`). A pre reading child cannot pass it.
- **No third party tracking or behavioral ads.** Analytics, ads, and crash reporting ship
  **off**; the native app contains no analytics, ads, or crash SDK at all.

**Subscriptions (for the IAP reviewer):**
- Premium is a `[7]` day free trial, then `$4.99` monthly or `$29.99` yearly, auto
  renewing, billed through the App Store / Google Play. Restore Purchases is on the
  paywall. Terms and Privacy links are shown before purchase.
- To reach the paywall: open any locked (premium) story from the library, or tap a plan,
  pass the parental gate, and choose a plan. Use a **sandbox / license test** account to
  complete the purchase without a real charge.
- **Note on the web build:** the web app intentionally **defers** the actual purchase to
  the native app (no purchase is completed or entitlement granted on the web), so the real
  IAP flow is exercised in the iOS / Android build only.

**Data deletion:** a parent can delete a single child profile, or delete the whole
account (which cascades to all child data), from Account settings inside the app. Deletion
requests by email go to `[SUPPORT EMAIL]`.

---

## Sources

- Apple App Review Guidelines — **1.3 Kids Category**, **3.1.1 / 3.1.2 In App Purchase &
  auto renewing subscriptions**, **4.8 Sign in with Apple**, **5.1.1(v) account
  deletion**, **5.1.4 Kids privacy**: https://developer.apple.com/app-store/review/guidelines/
- Apple — Auto renewable subscription requirements (point of sale disclosure):
  https://developer.apple.com/app-store/subscriptions/
- Google Play — **Families / Designed for Families** policy and ads in Families
  requirements: https://support.google.com/googleplay/android-developer/answer/9893335
- Google Play — Data Safety, advertising ID declaration, content ratings (see #62/#63).
- Repo: `docs/COMPLIANCE-COPPA.md` (#31), `docs/store/privacy-declarations.md` (#62),
  `docs/store/content-ratings.md` (#63), `docs/store/google-play-listing.md` (#61),
  `docs/TESTFLIGHT-PLAY-TESTING.md` (#59), and the code files listed in the header.
