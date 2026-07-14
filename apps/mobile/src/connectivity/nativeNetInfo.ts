// apps/mobile/src/connectivity/nativeNetInfo.ts
//
// The runtime loader and a narrow typed surface for `@react-native-community/netinfo`
// (issue #66). We keep this module OUT of the workspace lockfile on purpose and load
// it lazily, exactly like `expo-notifications` (src/notifications/nativeNotifications.ts)
// and `react-native-purchases` (src/billing/nativePurchases.ts):
//  - The repo's Windows lockfile drops the bundled wasm/@emnapi entries, so adding
//    native packages to the root lockfile breaks `npm ci` on Linux CI (see
//    docs/DEPLOYMENT.md and the Windows lockfile note). Loading via `require` and
//    falling back to a mock keeps CI green and the repo installable everywhere.
//  - So this repo, Expo Go without the module, and CI all run the mock; a dev build
//    that ran `npm run prepare:device-build` gets the real module.
//
// We type only the slice of the SDK we call, so the file typechecks whether or not
// the package is installed. See the SDK 57 NetInfo docs for the full state shape.

/** The connectivity fields we read off a NetInfo state. */
export type NetInfoStateSlice = {
  /** Whether there is an active network connection (null while unknown). */
  isConnected: boolean | null;
  /** Whether the internet is actually reachable through it (null while unknown). */
  isInternetReachable: boolean | null;
};

/** The `@react-native-community/netinfo` module surface we use. */
export type NetInfoModule = {
  /** Read the current state once. */
  fetch(): Promise<NetInfoStateSlice>;
  /** Subscribe to state changes; returns an unsubscribe function. */
  addEventListener(listener: (state: NetInfoStateSlice) => void): () => void;
};

let loaded: NetInfoModule | null | undefined;

/**
 * Load `@react-native-community/netinfo`, or null when it is not installed. Cached
 * so the require is attempted once. Never throws.
 */
export function loadNetInfo(): NetInfoModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // The optional module is present only once a developer runs the device-build
    // prepare step; a static import would fail to resolve in this repo / CI / Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-community/netinfo") as { default?: NetInfoModule } & NetInfoModule;
    // The package's default export is the module; some setups expose it directly.
    loaded = (mod.default ?? mod) as NetInfoModule;
  } catch {
    loaded = null;
  }
  return loaded;
}

/** Map a NetInfo state to the app's coarse connectivity. */
export function connectivityFromNetInfo(state: NetInfoStateSlice): "online" | "offline" | "unknown" {
  if (state.isConnected === false) return "offline";
  // Reachability can lag; treat a known-false as offline, otherwise trust the
  // connection. Both null means we do not know yet.
  if (state.isInternetReachable === false) return "offline";
  if (state.isConnected === true) return "online";
  return "unknown";
}
