// apps/mobile/src/review/expoProvider.ts
//
// The real store-review provider (issue #71), backed by expo-store-review when the
// native module is present. Every method fails soft: a review prompt is a bonus, so
// an error here must never disrupt a bedtime session. requestReview asks the OS to
// present ITS prompt; we never build our own star UI and never see the outcome.
import { Linking } from "react-native";
import type { StoreReviewProvider } from "./types";
import type { StoreReviewModule } from "./nativeStoreReview";
import { fallbackStoreUrl } from "./config";

export class ExpoStoreReviewProvider implements StoreReviewProvider {
  readonly name = "expo" as const;

  constructor(private readonly mod: StoreReviewModule) {}

  async isAvailable(): Promise<boolean> {
    try {
      return await this.mod.isAvailableAsync();
    } catch {
      return false;
    }
  }

  async requestReview(): Promise<boolean> {
    try {
      await this.mod.requestReview();
      return true;
    } catch {
      return false;
    }
  }

  storeUrl(): string | null {
    try {
      // Prefer the config-derived URL from expo (app.json store urls / the iOS
      // write-a-review deep link); fall back to a platform URL from the known ids.
      return this.mod.storeUrl() ?? fallbackStoreUrl();
    } catch {
      return fallbackStoreUrl();
    }
  }

  async openStoreListing(): Promise<boolean> {
    const url = this.storeUrl();
    if (!url) return false;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
}
