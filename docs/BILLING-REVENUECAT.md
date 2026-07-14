# Native in-app purchases with RevenueCat (issue #55)

How Bedtime Quests sells the monthly and yearly subscriptions (with a 7 day free
trial) inside the native app, and exactly what you must create in RevenueCat, App
Store Connect, and Google Play to turn it on. The code is complete; the steps below
are the store-side setup, which needs the developer accounts (#58) and store
listings / test tracks (#59).

## How it fits together

- **One entitlement rule everywhere.** Gating uses the shared `Subscription` from
  `@bedtime-quests/core` (issue #33). RevenueCat is the source of truth on device;
  the native app maps the SDK's active "premium" entitlement into that same
  `Subscription` with `subscriptionFromRevenueCat` (core), so a purchase unlocks
  premium through the exact rule the web app uses.
- **Web and native agree.** A native purchase fires the RevenueCat webhook, which
  writes the parent's entitlement row server side
  (`app/api/revenuecat/webhook`). Because the native app calls
  `Purchases.logIn(parentAccountId)` with the SAME id the web uses (`user.id`),
  the webhook's `app_user_id` matches the web account and the web app sees the
  purchase too. The app can also read the server's view directly at
  `GET /api/entitlements/current`.
- **Parent scoped (COPPA).** The RevenueCat `app_user_id` is the PARENT account id
  only, never a child name, id, or attribute (docs/COMPLIANCE-COPPA.md section
  6c). Purchases sit behind the parental gate (#32) before checkout.
- **Runs with no store setup.** When the native SDK or a public key is absent
  (Expo Go, CI, this repo, a dev build with no key), the app uses an in-memory
  MOCK billing provider: offerings render, a simulated purchase unlocks a trial,
  and restore reads it back. Nothing is charged and the mock says so plainly.

## Code map

| Piece | File |
| --- | --- |
| Pure CustomerInfo -> Subscription mapper (+ tests) | `packages/core/src/revenuecat-client.ts` |
| Entitlement id + product ids | `packages/core/src/plans.ts` (`PREMIUM_ENTITLEMENT_ID`, `PRODUCT_ID_MONTHLY/YEARLY`) |
| Billing seam (interface) | `apps/mobile/src/billing/types.ts` |
| Runtime SDK loader (dev build only) | `apps/mobile/src/billing/nativePurchases.ts` |
| Real RevenueCat provider | `apps/mobile/src/billing/revenueCatProvider.ts` |
| Mock provider | `apps/mobile/src/billing/mockProvider.ts` |
| Provider factory | `apps/mobile/src/billing/index.ts` |
| Store wiring (logIn/out, purchase, restore) | `apps/mobile/src/data/store.tsx` |
| Paywall UI + all states | `apps/mobile/src/screens/PaywallScreen.tsx` |
| Parental gate before checkout | `apps/mobile/src/screens/ParentalGate.tsx` (#32) |
| Server reconciliation endpoint | `app/api/entitlements/current/route.ts` |
| Server webhook (already existed, #33) | `app/api/revenuecat/webhook/route.ts` |

## Step 1: install the SDK and make a dev build (needs #58/#59)

In-app purchases are native code (StoreKit / Google Play Billing), so they DO NOT
run in Expo Go: you need an Expo **development build**. This repo intentionally does
NOT vendor the SDK into the monorepo lockfile (a single root lockfile shared with
the web app; adding an uninstalled dependency would break `npm ci` on CI). Install
it in your dev-build environment, which updates `package.json` + the lockfile in one
correct step:

```
cd apps/mobile
npx expo install react-native-purchases expo-dev-client
npx expo prebuild                 # generates the native projects
eas build --profile development   # or: npx expo run:ios / run:android
```

No Expo config plugin is required for `react-native-purchases`; it autolinks once
installed. The `loadPurchases()` loader picks it up at runtime; until then the app
runs on the mock.

## Step 2: create the store products

Use these EXACT product identifiers (they are mirrored in
`packages/core/src/plans.ts`; keep the two in sync):

| Plan | Product id | Price | Trial |
| --- | --- | --- | --- |
| Monthly | `bedtimequests_premium_monthly` | $4.99 / month | 7 day free trial |
| Yearly | `bedtimequests_premium_yearly` | $29.99 / year | 7 day free trial |

**App Store Connect** (needs the Apple account, #58):
1. My Apps > Bedtime Quests > Subscriptions.
2. Create a Subscription Group, e.g. "Bedtime Quests Premium".
3. Add two auto-renewable subscriptions with the ids above and prices above.
4. On EACH, add an **Introductory Offer** of type "Free" for **1 week**.
5. Fill in localized display name / description with NO dashes in copy.

**Google Play Console** (needs the Google account, #58):
1. Monetize > Products > Subscriptions.
2. Create two subscriptions with the ids above.
3. Add a base plan (auto-renewing, monthly / yearly) with the prices above.
4. Add a **free trial offer** of **7 days** to each base plan.

## Step 3: configure RevenueCat

1. Create a RevenueCat project; add the iOS app (App Store shared secret) and the
   Android app (Play service-account credentials).
2. **Products:** import / add `bedtimequests_premium_monthly` and
   `bedtimequests_premium_yearly` for each store.
3. **Entitlement:** create ONE entitlement with identifier **`premium`** and attach
   BOTH products to it. (The app reads `PREMIUM_ENTITLEMENT_ID = "premium"`.)
4. **Offering:** create the default (current) offering and add two packages, the
   monthly and the yearly, pointing at the two products. The app matches packages
   to plans by store product id, so any package identifiers are fine.
5. **API keys:** copy the **public** iOS key (`appl_...`) and Android key
   (`goog_...`) into `apps/mobile/.env.local` as `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
   / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
6. **Webhook (already coded):** Project settings > Integrations > Webhooks. URL:
   `https://YOUR_DOMAIN/api/revenuecat/webhook`. Set an Authorization header value
   and put the SAME value in the web app's `REVENUECAT_WEBHOOK_AUTH_TOKEN` (see the
   root `.env.example`). This is what keeps web entitlement in step with native
   purchases.

## What is verified now vs. deferred

**Verified without live store products (this change):**
- Web + core unit tests pass, including the new `subscriptionFromRevenueCat`
  mapping (`npm run test` at the repo root).
- The mobile app typechecks with the SDK uninstalled (`npm run typecheck` in
  `apps/mobile`), because the SDK is loaded at runtime, not imported statically.
- The paywall renders offerings, a simulated purchase unlocks premium immediately
  (mock provider), and restore reads the entitlement back. Force each state with
  `EXPO_PUBLIC_BILLING_MOCK_OUTCOME=success|cancelled|pending|error`.

**Deferred until store products + accounts exist (#58 accounts, #59 test tracks):**
- A real sandbox purchase of each product on a device / TestFlight / Play internal
  testing, including the 7 day free trial and Ask to Buy (pending) approval.
- The webhook writing the entitlement row for the real `app_user_id`, and web +
  native both reading premium for the same parent.
- Restore purchases against a real prior sandbox purchase.
- Store review of the subscription metadata and the kids-category requirements.

> Note: the native app's real auth is still a stub (issue #54 seam), so today the
> parent `app_user_id` is a stable, opaque, parent-scoped stand-in. Once BetterAuth
> is wired for the native client (bearer session), pass the real `user.id` to
> `Purchases.logIn` so the webhook `app_user_id` matches the web account exactly.
