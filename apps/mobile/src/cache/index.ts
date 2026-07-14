// apps/mobile/src/cache/index.ts
//
// The key/value store factory (issue #66): use the persistent AsyncStorage store
// when the native module is present, otherwise fall back to the in-memory store so
// the app always runs (Expo Go without the module, CI, this repo). Callers depend
// only on the KeyValueStore interface. Mirrors the other native-module seams.
import { loadAsyncStorage } from "./nativeAsyncStorage";
import { AsyncStorageStore } from "./asyncStorageStore";
import { MemoryStore } from "./memoryStore";
import type { KeyValueStore } from "./types";

export type { KeyValueStore } from "./types";
export { OfflineCache } from "./offlineCache";

/**
 * Build the key/value store for this runtime. The real AsyncStorage store only when
 * the module loaded; every other case uses the in-memory store.
 */
export function createKeyValueStore(): KeyValueStore {
  const mod = loadAsyncStorage();
  if (mod) return new AsyncStorageStore(mod);
  return new MemoryStore();
}
