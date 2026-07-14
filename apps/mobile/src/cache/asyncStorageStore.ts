// apps/mobile/src/cache/asyncStorageStore.ts
//
// The real, persistent key/value store (issue #66), backed by AsyncStorage. Active
// only in a dev build where the native module loaded. Every method is best-effort:
// a storage error must never crash a bedtime session, so reads fall back to null and
// writes swallow. The offline cache treats "no cached copy" and "storage failed" the
// same way, so failing soft here is safe.
import type { KeyValueStore } from "./types";
import type { AsyncStorageModule } from "./nativeAsyncStorage";

export class AsyncStorageStore implements KeyValueStore {
  readonly name = "async-storage" as const;

  constructor(private readonly mod: AsyncStorageModule) {}

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.mod.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.mod.setItem(key, value);
    } catch {
      /* best effort: a failed cache write just means a later cache miss. */
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.mod.removeItem(key);
    } catch {
      /* best effort. */
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.mod.multiRemove(keys);
    } catch {
      /* best effort. */
    }
  }
}
