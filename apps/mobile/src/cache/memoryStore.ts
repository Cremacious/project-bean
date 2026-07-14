// apps/mobile/src/cache/memoryStore.ts
//
// The in-memory key/value store (issue #66). It runs whenever AsyncStorage is not
// available (Expo Go, CI, this repo), so the offline cache and outbox logic is fully
// exercisable with no native module. It is NOT persistent across an app restart
// (that needs the real AsyncStorage store from a dev build), which is fine for this
// UI port: within a session the read-through cache, eviction, and outbox all behave
// exactly as they will on device, and the whole flow already works offline because
// the launch library is bundled.
import type { KeyValueStore } from "./types";

export class MemoryStore implements KeyValueStore {
  readonly name = "memory" as const;

  private map = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.map.delete(key);
  }

  async multiRemove(keys: string[]): Promise<void> {
    for (const k of keys) this.map.delete(k);
  }
}
