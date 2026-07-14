// apps/mobile/src/cache/offlineCache.ts
//
// The read-through offline cache (issue #66, scope a). It persists the data a
// bedtime session needs so reading survives a dropped connection:
//   - the last-seen catalog (browse the library offline),
//   - each story the child OPENS (revisit or finish it offline), bounded LRU so the
//     cache never grows without limit,
//   - a snapshot of the active reader profile,
//   - an outbox of writes (recording an ending) made while offline, to replay when
//     connectivity returns.
//
// All bookkeeping decisions (which stories to evict, how to de-dupe queued writes)
// live in the pure, unit-tested core module @bedtime-quests/core/offline; this class
// only does the I/O around them, against the swappable KeyValueStore seam. Every
// method is best-effort and never throws: a cache miss and a storage error are
// treated the same, so an offline hiccup can never break reading.
//
// Today the launch library is BUNDLED (src/content), so the app already reads every
// story offline; this cache is the read-through machinery that keeps working the
// moment story content moves behind the REST API the app still needs (see README).
// It coordinates conceptually with OTA updates (#67): when back online we refresh
// from the network, which is what invalidates a stale cache. OTA itself is not here.
import type { StoryInput } from "@bedtime-quests/core/stories/story-types";
import {
  touchStoryCache,
  enqueueWrite,
  removeWrites,
  DEFAULT_STORY_CACHE_MAX,
  type StoryCacheIndex,
  type PendingEndingWrite,
} from "@bedtime-quests/core/offline";
import type { KeyValueStore } from "./types";
import type { CatalogStory, ChildProfile } from "../data/types";

// Namespaced keys so the cache never collides with anything else in the store.
const K = {
  catalog: "bq.cache.catalog",
  profile: "bq.cache.profile",
  index: "bq.cache.story-index",
  story: (slug: string) => `bq.cache.story.${slug}`,
  outbox: "bq.cache.outbox",
} as const;

/** Parse JSON without ever throwing; returns null on any problem. */
function parse<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class OfflineCache {
  constructor(
    private readonly store: KeyValueStore,
    private readonly max: number = DEFAULT_STORY_CACHE_MAX,
  ) {}

  /** Which underlying store is active (for diagnostics / the README verification). */
  get storeName(): KeyValueStore["name"] {
    return this.store.name;
  }

  // --- Catalog ---------------------------------------------------------------

  async saveCatalog(catalog: CatalogStory[]): Promise<void> {
    await this.store.setItem(K.catalog, JSON.stringify(catalog));
  }

  async loadCatalog(): Promise<CatalogStory[] | null> {
    return parse<CatalogStory[]>(await this.store.getItem(K.catalog));
  }

  // --- Active reader profile snapshot ---------------------------------------

  async saveProfile(profile: ChildProfile | null): Promise<void> {
    if (!profile) return;
    await this.store.setItem(K.profile, JSON.stringify(profile));
  }

  async loadProfile(): Promise<ChildProfile | null> {
    return parse<ChildProfile>(await this.store.getItem(K.profile));
  }

  // --- Read-through story cache (bounded LRU) --------------------------------

  private async loadIndex(): Promise<StoryCacheIndex> {
    return parse<StoryCacheIndex>(await this.store.getItem(K.index)) ?? {};
  }

  /**
   * Persist a story the child just opened and record the access, evicting the
   * least-recently-used stories beyond the cap (their payloads are deleted too).
   */
  async saveStory(slug: string, story: StoryInput, now: number = Date.now()): Promise<void> {
    await this.store.setItem(K.story(slug), JSON.stringify(story));
    const { index, evicted } = touchStoryCache(await this.loadIndex(), slug, now, this.max);
    await this.store.setItem(K.index, JSON.stringify(index));
    if (evicted.length > 0) await this.store.multiRemove(evicted.map(K.story));
  }

  /** Read a saved story back, or null if it was never opened / has been evicted. */
  async loadStory(slug: string): Promise<StoryInput | null> {
    return parse<StoryInput>(await this.store.getItem(K.story(slug)));
  }

  /** The slugs currently held in the read-through cache (for diagnostics/tests). */
  async cachedStorySlugs(): Promise<string[]> {
    return Object.keys(await this.loadIndex());
  }

  // --- Offline write outbox --------------------------------------------------

  async loadOutbox(): Promise<PendingEndingWrite[]> {
    return parse<PendingEndingWrite[]>(await this.store.getItem(K.outbox)) ?? [];
  }

  /** Queue an ending recorded while offline (de-duplicated in core). */
  async enqueueEnding(write: Omit<PendingEndingWrite, "kind" | "queuedAt">, now: number = Date.now()): Promise<number> {
    const full: PendingEndingWrite = { kind: "recordEnding", queuedAt: now, ...write };
    const next = enqueueWrite(await this.loadOutbox(), full);
    await this.store.setItem(K.outbox, JSON.stringify(next));
    return next.length;
  }

  /**
   * Remove the given writes after a successful replay and return the remaining
   * count. With no backend yet the store's flush simply clears them (the ending is
   * already recorded on-device); when the REST API lands, the caller replays each
   * write first and only then removes it.
   */
  async removeFromOutbox(done: PendingEndingWrite[]): Promise<number> {
    const next = removeWrites(await this.loadOutbox(), done);
    await this.store.setItem(K.outbox, JSON.stringify(next));
    return next.length;
  }

  /** Clear all sign-in-scoped cache on sign out (progress + queued writes). */
  async clearSession(): Promise<void> {
    await this.store.multiRemove([K.profile, K.outbox]);
  }
}
