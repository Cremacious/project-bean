// packages/core/src/offline.ts
//
// The platform-agnostic model for offline handling (issue #66). Everything here is
// pure and framework-free (no React Native, no NetInfo, no AsyncStorage, no I/O),
// so the "where should I read from?" decision, the bounded read-through story cache
// bookkeeping, the offline write outbox, and the offline-state copy are decided
// once and unit-tested, then reused by the native app's connectivity + cache layers.
//
// Scope (issue #66, option a): a read-through cache of the stories a child has
// OPENED plus the last-seen catalog/profile, so a revisited or in-progress bedtime
// story survives a dropped connection. Writes made offline (recording an ending)
// are queued in the outbox and replayed when connectivity returns; reading is never
// blocked on the network.
//
// Copy obeys the app-wide rule: NO dashes in user-facing text (docs/WORKFLOW.md
// rule 1). The *Text() helpers are unit-tested to guarantee that.

/** Coarse connectivity, mapped from NetInfo (or forced for QA). */
export type Connectivity = "online" | "offline" | "unknown";

/** Where a screen should read its data from, given connectivity + a cached copy. */
export type ReadSource = "network" | "cache" | "unavailable";

/**
 * Decide where to read from. Offline-first: when a cached copy exists we prefer it
 * over a network attempt unless we KNOW we are online, so a dropped connection or an
 * unconfirmed state shows saved content instantly instead of a spinner. With no
 * cache we still attempt the network unless we positively know we are offline (then
 * the content is genuinely unavailable). When back online we always go to the
 * network, which is what refreshes a stale cache.
 */
export function chooseReadSource(opts: { connectivity: Connectivity; hasCache: boolean }): ReadSource {
  const { connectivity, hasCache } = opts;
  if (connectivity === "online") return "network";
  if (hasCache) return "cache";
  return connectivity === "offline" ? "unavailable" : "network";
}

/** True only when we positively know the device is offline (drives the banner). */
export function isDefinitelyOffline(connectivity: Connectivity): boolean {
  return connectivity === "offline";
}

// --- Bounded read-through story cache ---------------------------------------

/** Per-slug bookkeeping for the read-through story cache (LRU by last access). */
export type StoryCacheIndex = Record<string, { lastAccess: number }>;

/** Default cap on cached stories. Bounds disk use; comfortably above the launch library. */
export const DEFAULT_STORY_CACHE_MAX = 12;

/**
 * Record that `slug` was just accessed at `now`, then evict least-recently-used
 * entries beyond `max`. Returns the next index plus the slugs whose payloads the
 * caller should delete from storage. The just-touched slug is never evicted. Pure:
 * no I/O, so the eviction policy is unit-tested independently of storage.
 */
export function touchStoryCache(
  index: StoryCacheIndex,
  slug: string,
  now: number,
  max: number = DEFAULT_STORY_CACHE_MAX,
): { index: StoryCacheIndex; evicted: string[] } {
  const next: StoryCacheIndex = { ...index, [slug]: { lastAccess: now } };
  const slugs = Object.keys(next);
  if (slugs.length <= Math.max(1, max)) return { index: next, evicted: [] };

  // Oldest first; never evict the slug we just touched.
  const byAge = slugs
    .filter((s) => s !== slug)
    .sort((a, b) => next[a].lastAccess - next[b].lastAccess);
  const evicted = byAge.slice(0, slugs.length - Math.max(1, max));
  for (const s of evicted) delete next[s];
  return { index: next, evicted };
}

// --- Offline write outbox ----------------------------------------------------

/**
 * A write made while offline, to replay when connectivity returns. Today the only
 * write the app makes is recording an ending; the discriminant leaves room for more
 * (achievements, reading prefs) without changing the queue's shape.
 */
export type PendingEndingWrite = {
  kind: "recordEnding";
  childId: number;
  slug: string;
  pageKey: string;
  queuedAt: number;
};

/** Stable identity so the same ending queued twice offline is not duplicated. */
export function outboxKey(w: PendingEndingWrite): string {
  return `${w.kind}:${w.childId}:${w.slug}:${w.pageKey}`;
}

/** Add a write, de-duplicating by identity (the first queuedAt wins). */
export function enqueueWrite(outbox: PendingEndingWrite[], write: PendingEndingWrite): PendingEndingWrite[] {
  const key = outboxKey(write);
  if (outbox.some((w) => outboxKey(w) === key)) return outbox;
  return [...outbox, write];
}

/** Remove the given writes (by identity) after a successful flush. */
export function removeWrites(outbox: PendingEndingWrite[], done: PendingEndingWrite[]): PendingEndingWrite[] {
  const keys = new Set(done.map(outboxKey));
  return outbox.filter((w) => !keys.has(outboxKey(w)));
}

// --- Offline-state copy (dash-free, warm, high-contrast wording) -------------

/** The calm banner shown while the device is offline. */
export function offlineBannerText(): string {
  return "You are offline right now. You can still read your saved stories.";
}

/** Shown when a story cannot be opened because it was never saved and we are offline. */
export function offlineUnavailableText(): string {
  return "This story is not saved on this device yet. Connect to the internet once to save it.";
}

/** Reassurance after finishing a story offline: progress is safe and will sync. */
export function offlineSavedEndingText(): string {
  return "Saved on this device. Your progress will sync when you are back online.";
}
