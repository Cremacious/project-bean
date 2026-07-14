// apps/mobile/src/updates/mockProvider.ts
//
// The in-memory OTA provider (issue #67). It runs whenever `expo-updates` is not
// available or OTA is not enabled (Expo Go, a dev client, CI, this repo, or a build
// before the prepare step), so the app always has an updates signal and never
// crashes reaching for a missing module. It reports OTA as disabled and finds no
// update, so the check-on-launch strategy quietly does nothing.
//
// QA / simulation: the context (context.tsx) applies the EXPO_PUBLIC_FORCE_UPDATE_READY
// override on top of ANY provider, so the "update ready" notice is exercisable in
// Expo Go without a native module. The mock therefore stays deliberately simple.
import type { UpdateCheckResult, UpdateFetchResult, UpdatesProvider } from "./types";

export class MockUpdatesProvider implements UpdatesProvider {
  readonly name = "mock" as const;
  readonly isEnabled = false;
  readonly channel = null;
  readonly runtimeVersion = null;

  async checkForUpdate(): Promise<UpdateCheckResult> {
    return { isAvailable: false };
  }

  async fetchUpdate(): Promise<UpdateFetchResult> {
    return { isNew: false };
  }

  async reload(): Promise<void> {
    // No real bundle to swap in the mock; a reload is a no-op. Simulated "update
    // ready" is driven by EXPO_PUBLIC_FORCE_UPDATE_READY in the context.
  }
}
