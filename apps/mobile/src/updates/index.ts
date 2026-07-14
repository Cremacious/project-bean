// apps/mobile/src/updates/index.ts
//
// The OTA updates factory (issue #67): use the real `expo-updates` provider only
// when the native module is present AND OTA is enabled for this build; otherwise
// fall back to the in-memory mock so the app always runs (Expo Go, a dev client, CI,
// this repo). Callers depend only on the UpdatesProvider interface. Mirrors the
// billing / notifications / connectivity factories.
import { loadExpoUpdates } from "./nativeUpdates";
import { ExpoUpdatesProvider } from "./expoUpdatesProvider";
import { MockUpdatesProvider } from "./mockProvider";
import type { UpdatesProvider } from "./types";

export type { UpdatesProvider, UpdateCheckResult, UpdateFetchResult } from "./types";

/**
 * Build the updates provider for this runtime. The real provider only when the
 * module loaded and reports OTA enabled; every other case uses the mock. (A dev
 * client can have the module installed but `isEnabled` false, so the mock's calm
 * "nothing to do" behavior is exactly right there too.)
 */
export function createUpdatesProvider(): UpdatesProvider {
  const mod = loadExpoUpdates();
  if (mod && mod.isEnabled === true) return new ExpoUpdatesProvider(mod);
  return new MockUpdatesProvider();
}
