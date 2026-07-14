// apps/mobile/src/billing/index.ts
//
// The billing factory (issue #55): pick the real RevenueCat provider when the SDK
// is present in the build AND a public key is configured, otherwise fall back to
// the in-memory mock so the app always runs (Expo Go, CI, this repo, or a dev build
// with no key). Callers depend only on the BillingProvider interface, so they never
// branch on which one they got.
import { revenueCatApiKey } from "./config";
import { loadPurchases } from "./nativePurchases";
import { RevenueCatProvider } from "./revenueCatProvider";
import { MockProvider } from "./mockProvider";
import type { BillingProvider } from "./types";

export type { BillingProvider, OfferedPlan, PurchaseOutcome, RestoreOutcome } from "./types";

/**
 * Build the billing provider for this runtime. Real RevenueCat only when both the
 * native module loads (a dev build with react-native-purchases installed) and a
 * platform public key is set; every other case uses the mock.
 */
export function createBillingProvider(): BillingProvider {
  const mod = loadPurchases();
  const apiKey = revenueCatApiKey();
  if (mod && apiKey) {
    return new RevenueCatProvider(mod.default, apiKey, mod.LOG_LEVEL, mod.PURCHASES_ERROR_CODE);
  }
  return new MockProvider();
}
