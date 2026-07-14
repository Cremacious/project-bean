// apps/mobile/src/updates/nativeUpdates.ts
//
// The runtime loader and a narrow typed surface for `expo-updates` (issue #67). We
// keep this module OUT of the workspace lockfile on purpose and load it lazily,
// exactly like `@react-native-community/netinfo` (src/connectivity/nativeNetInfo.ts),
// `expo-notifications` (src/notifications/nativeNotifications.ts), and
// `react-native-purchases` (src/billing/nativePurchases.ts):
//  - The repo's Windows lockfile drops the bundled wasm/@emnapi entries, so adding
//    native packages to the root lockfile breaks `npm ci` on Linux CI (see
//    docs/DEPLOYMENT.md and the Windows lockfile note). Loading via `require` and
//    falling back to a mock keeps CI green and the repo installable everywhere.
//  - So this repo, Expo Go, a dev client, and CI all run the mock; a store / preview
//    build that ran `npm run prepare:device-build` gets the real module.
//
// We type only the slice of the SDK we call, so the file typechecks whether or not
// the package is installed. See the SDK 57 expo-updates docs for the full surface.

/** The `expo-updates` module surface we use. */
export type ExpoUpdatesModule = {
  /** True only in a build where OTA is actually active (never in Expo Go / dev). */
  isEnabled: boolean;
  /** The EAS Update channel this build follows, or null. */
  channel: string | null;
  /** The runtime version this build reports, or null. */
  runtimeVersion: string | null;
  /** Query the server for an available, compatible update. */
  checkForUpdateAsync(): Promise<{ isAvailable: boolean }>;
  /** Download the newest update; it becomes pending for the next launch. */
  fetchUpdateAsync(): Promise<{ isNew: boolean }>;
  /** Reload the app, applying the most recently downloaded update. */
  reloadAsync(): Promise<void>;
};

let loaded: ExpoUpdatesModule | null | undefined;

/**
 * Load `expo-updates`, or null when it is not installed. Cached so the require is
 * attempted once. Never throws.
 */
export function loadExpoUpdates(): ExpoUpdatesModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // The optional module is present only once a developer runs the device-build
    // prepare step; a static import would fail to resolve in this repo / CI / Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-updates") as { default?: ExpoUpdatesModule } & ExpoUpdatesModule;
    // Some setups expose the module on `default`; most expose it directly.
    loaded = (mod.default ?? mod) as ExpoUpdatesModule;
  } catch {
    loaded = null;
  }
  return loaded;
}
