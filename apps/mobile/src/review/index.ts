// apps/mobile/src/review/index.ts
//
// The store-review factory (issue #71): use the real expo-store-review provider
// when the native module is present, otherwise fall back to the in-memory mock so
// the app always runs (Expo Go without it, CI, this repo). Callers depend only on
// the StoreReviewProvider interface. Mirrors the other native-module seams.
import { loadStoreReview } from "./nativeStoreReview";
import { ExpoStoreReviewProvider } from "./expoProvider";
import { MockStoreReviewProvider } from "./mockProvider";
import type { StoreReviewProvider } from "./types";

export type { StoreReviewProvider } from "./types";

/**
 * Build the store-review provider for this runtime. The real Expo provider only
 * when expo-store-review loaded; every other case uses the mock.
 */
export function createStoreReviewProvider(): StoreReviewProvider {
  const mod = loadStoreReview();
  if (mod) return new ExpoStoreReviewProvider(mod);
  return new MockStoreReviewProvider();
}
