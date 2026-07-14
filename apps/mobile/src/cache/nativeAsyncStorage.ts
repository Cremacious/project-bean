// apps/mobile/src/cache/nativeAsyncStorage.ts
//
// The runtime loader and a narrow typed surface for
// `@react-native-async-storage/async-storage` (issue #66). Kept OUT of the workspace
// lockfile and loaded lazily, exactly like the other optional native modules
// (nativeNetInfo, nativeNotifications, nativePurchases): the repo's Windows lockfile
// drops the wasm/@emnapi entries, so adding native packages to the root lockfile
// breaks `npm ci` on Linux CI. Loading via `require` with a mock fallback keeps CI
// green and the repo installable everywhere; a dev build that ran
// `npm run prepare:device-build` gets the real persistent store.
//
// We type only the slice of the API we call. AsyncStorage is a small key/value store
// (documented for SDK 57 at react-native-async-storage.github.io), ideal for the
// bounded read-through cache this issue needs (a few story graphs + catalog).

/** The `@react-native-async-storage/async-storage` surface we use. */
export type AsyncStorageModule = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
};

let loaded: AsyncStorageModule | null | undefined;

/**
 * Load AsyncStorage, or null when it is not installed. Cached so the require is
 * attempted once. Never throws.
 */
export function loadAsyncStorage(): AsyncStorageModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // The optional module is present only after the device-build prepare step; a
    // static import would fail to resolve in this repo / CI / Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-async-storage/async-storage") as { default?: AsyncStorageModule } & AsyncStorageModule;
    loaded = (mod.default ?? mod) as AsyncStorageModule;
  } catch {
    loaded = null;
  }
  return loaded;
}
