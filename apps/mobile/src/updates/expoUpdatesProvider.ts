// apps/mobile/src/updates/expoUpdatesProvider.ts
//
// The real OTA provider (issue #67), a thin wrapper over the `expo-updates` module.
// It runs only in a build where the native module loaded AND `Updates.isEnabled` is
// true (a store / preview build). Everywhere else the factory picks the mock. Every
// call is defensive: a failed check or download must never break a launch, so the
// provider swallows errors into a benign "nothing available" result. The context
// owns the strategy (check on launch, download in background, apply next launch).
import type { ExpoUpdatesModule } from "./nativeUpdates";
import type { UpdateCheckResult, UpdateFetchResult, UpdatesProvider } from "./types";

export class ExpoUpdatesProvider implements UpdatesProvider {
  readonly name = "expo-updates" as const;

  constructor(private readonly mod: ExpoUpdatesModule) {}

  get isEnabled(): boolean {
    return this.mod.isEnabled === true;
  }

  get channel(): string | null {
    return this.mod.channel ?? null;
  }

  get runtimeVersion(): string | null {
    return this.mod.runtimeVersion ?? null;
  }

  async checkForUpdate(): Promise<UpdateCheckResult> {
    try {
      const res = await this.mod.checkForUpdateAsync();
      return { isAvailable: res.isAvailable === true };
    } catch {
      // A failed check (offline, server hiccup) is not an error the user should see;
      // we simply treat it as "no update this launch" and try again next cold start.
      return { isAvailable: false };
    }
  }

  async fetchUpdate(): Promise<UpdateFetchResult> {
    try {
      const res = await this.mod.fetchUpdateAsync();
      return { isNew: res.isNew === true };
    } catch {
      return { isNew: false };
    }
  }

  async reload(): Promise<void> {
    // Only ever called on an explicit user tap from a calm screen (never mid-story).
    await this.mod.reloadAsync();
  }
}
