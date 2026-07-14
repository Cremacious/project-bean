// apps/mobile/src/billing/config.ts
//
// Billing configuration read from Expo PUBLIC env (issue #55). RevenueCat's SDK
// keys are PUBLIC by design (they ship in the app bundle and only allow reads /
// purchases, never account changes), so they belong in EXPO_PUBLIC_* vars, not in
// a secret. They are NEVER hardcoded here and .env.local is never read: the app
// simply falls back to the mock billing provider when a key is absent, so it runs
// in Expo Go, in CI, and in this repo with no store setup.
//
// COPPA (docs/COMPLIANCE-COPPA.md section 6c): none of this touches child data.
import { Platform } from "react-native";

/**
 * The RevenueCat PUBLIC SDK key for the current platform, or null when it is not
 * configured (dev, Expo Go, CI). iOS and Android have separate keys in RevenueCat.
 */
export function revenueCatApiKey(): string | null {
  const key =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
        : undefined;
  return key && key.length > 0 ? key : null;
}

/**
 * The web backend base URL the app reconciles entitlement against
 * (GET /api/entitlements/current). Optional: RevenueCat is the on-device source of
 * truth, so gating works without it; this is only for cross checking the account.
 */
export function apiBaseUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url && url.length > 0 ? url : null;
}

/**
 * Optional override that lets the mock provider simulate each purchase outcome
 * without live store products (success | cancelled | pending | error), so all of
 * the states in the paywall are verifiable before #58/#59 exist. Defaults to
 * "success" and is ignored entirely once the real RevenueCat provider is active.
 */
export function mockPurchaseOutcome(): "success" | "cancelled" | "pending" | "error" {
  const v = process.env.EXPO_PUBLIC_BILLING_MOCK_OUTCOME;
  return v === "cancelled" || v === "pending" || v === "error" ? v : "success";
}
