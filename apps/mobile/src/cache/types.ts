// apps/mobile/src/cache/types.ts
//
// The key/value storage seam (issue #66). The offline cache is written against this
// tiny interface, satisfied by AsyncStorage in a dev build or an in-memory map
// everywhere else (Expo Go, CI, this repo), mirroring the billing / notifications /
// connectivity seams. Values are strings (JSON), so the store stays trivial and
// swappable (SQLite/FileSystem later) without touching the cache logic.
export interface KeyValueStore {
  /** Which store is active ("async-storage" on device, else "memory"). */
  readonly name: "async-storage" | "memory";
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  /** Remove several keys at once (used when the cache evicts stories). */
  multiRemove(keys: string[]): Promise<void>;
}
