// apps/mobile/src/review/mockProvider.ts
//
// The in-memory store-review provider (issue #71). It runs whenever
// expo-store-review is not installed (Expo Go without it, CI, this repo), so the
// WHOLE trigger flow and the settings entry are exercisable with no native module:
// the milestone decision, the "would ask the OS now" path, and the manual fallback
// all run against this simulation. Nothing is ever sent to a real store here.
//
// To verify the "native prompt unavailable" path (which must still leave the manual
// settings fallback working) set EXPO_PUBLIC_STORE_REVIEW_MOCK_AVAILABLE=false,
// mirroring the notifications mock's EXPO_PUBLIC_NOTIF_MOCK_PERMISSION override.
import type { StoreReviewProvider } from "./types";

export class MockStoreReviewProvider implements StoreReviewProvider {
  readonly name = "mock" as const;

  async isAvailable(): Promise<boolean> {
    return process.env.EXPO_PUBLIC_STORE_REVIEW_MOCK_AVAILABLE !== "false";
  }

  async requestReview(): Promise<boolean> {
    // No real OS prompt in the mock; simulate a successful request so the caller's
    // capping and cooldown bookkeeping runs exactly as it will on a device.
    return true;
  }

  storeUrl(): string | null {
    // A stable placeholder so the manual settings entry is exercisable in preview.
    return "https://bedtimequests.example/app-listing";
  }

  async openStoreListing(): Promise<boolean> {
    // Would open storeUrl() on a device; in preview we just report success.
    return true;
  }
}
