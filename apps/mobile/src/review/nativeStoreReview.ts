// apps/mobile/src/review/nativeStoreReview.ts
//
// Runtime loader + a narrow typed surface for `expo-store-review` (issue #71). We
// keep this module OUT of the workspace lockfile on purpose and load it lazily,
// exactly like `expo-notifications` (src/notifications/nativeNotifications.ts) and
// `react-native-purchases`:
//  - The repo's Windows lockfile drops bundled wasm/@emnapi entries, so adding
//    native packages to the root lockfile breaks `npm ci` on Linux CI (see
//    docs/DEPLOYMENT.md and the Windows lockfile note). Loading via `require` and
//    falling back to a mock keeps CI green and the repo installable everywhere.
//  - So this repo, Expo Go without the module, and CI all run the mock; a dev /
//    device build that ran `npm run prepare:device-build` gets the real module.
//
// We type only the slice of the SDK 57 API we call, so this file typechecks whether
// or not the package is installed.

/** The `expo-store-review` module surface we use (SDK 57 docs). */
export type StoreReviewModule = {
  /** True when the OS in-app review prompt can be presented (not on web/TestFlight). */
  isAvailableAsync(): Promise<boolean>;
  /** Ask the OS to present its native prompt. The OS decides whether to show it. */
  requestReview(): Promise<void>;
  /** The config-derived store listing URL, or null. */
  storeUrl(): string | null;
  /** True when either the native prompt or a store URL is available. */
  hasAction(): Promise<boolean>;
};

let loaded: StoreReviewModule | null | undefined;

/**
 * Load `expo-store-review`, or null when it is not installed. Cached so the require
 * is attempted once. Never throws.
 */
export function loadStoreReview(): StoreReviewModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // The optional module is loaded at runtime (present only once a developer runs
    // `npm run prepare:device-build`); a static import would fail to resolve in this
    // repo / CI / Expo Go without it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("expo-store-review") as StoreReviewModule;
  } catch {
    loaded = null;
  }
  return loaded;
}
