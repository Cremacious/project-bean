// packages/core/src/offline.test.ts
import { describe, expect, it } from "vitest";
import {
  chooseReadSource,
  isDefinitelyOffline,
  touchStoryCache,
  DEFAULT_STORY_CACHE_MAX,
  outboxKey,
  enqueueWrite,
  removeWrites,
  offlineBannerText,
  offlineUnavailableText,
  offlineSavedEndingText,
  type PendingEndingWrite,
  type StoryCacheIndex,
} from "./offline";

describe("chooseReadSource — the online/offline read decision", () => {
  it("goes to the network whenever we know we are online (refreshes a stale cache)", () => {
    expect(chooseReadSource({ connectivity: "online", hasCache: false })).toBe("network");
    expect(chooseReadSource({ connectivity: "online", hasCache: true })).toBe("network");
  });

  it("serves the cache when offline and a saved copy exists", () => {
    expect(chooseReadSource({ connectivity: "offline", hasCache: true })).toBe("cache");
  });

  it("is unavailable only when offline with nothing saved", () => {
    expect(chooseReadSource({ connectivity: "offline", hasCache: false })).toBe("unavailable");
  });

  it("is offline-first when connectivity is unknown: cache if we have it, else try the network", () => {
    expect(chooseReadSource({ connectivity: "unknown", hasCache: true })).toBe("cache");
    expect(chooseReadSource({ connectivity: "unknown", hasCache: false })).toBe("network");
  });
});

describe("isDefinitelyOffline", () => {
  it("is true only for a confirmed offline state", () => {
    expect(isDefinitelyOffline("offline")).toBe(true);
    expect(isDefinitelyOffline("online")).toBe(false);
    expect(isDefinitelyOffline("unknown")).toBe(false);
  });
});

describe("touchStoryCache — bounded LRU read-through cache", () => {
  it("adds a new entry with its access time and evicts nothing under the cap", () => {
    const { index, evicted } = touchStoryCache({}, "starlight-sail", 100, 3);
    expect(index["starlight-sail"]).toEqual({ lastAccess: 100 });
    expect(evicted).toEqual([]);
  });

  it("refreshes the access time of an existing entry without growing the set", () => {
    const start: StoryCacheIndex = { a: { lastAccess: 1 }, b: { lastAccess: 2 } };
    const { index, evicted } = touchStoryCache(start, "a", 9, 3);
    expect(index.a).toEqual({ lastAccess: 9 });
    expect(Object.keys(index).sort()).toEqual(["a", "b"]);
    expect(evicted).toEqual([]);
  });

  it("evicts the least-recently-used entries beyond the cap", () => {
    const start: StoryCacheIndex = { a: { lastAccess: 1 }, b: { lastAccess: 2 }, c: { lastAccess: 3 } };
    const { index, evicted } = touchStoryCache(start, "d", 4, 2);
    // Cap 2, 4 entries after touch -> evict the two oldest (a, b).
    expect(evicted.sort()).toEqual(["a", "b"]);
    expect(Object.keys(index).sort()).toEqual(["c", "d"]);
  });

  it("never evicts the slug it just touched, even when it is the oldest by prior time", () => {
    const start: StoryCacheIndex = { a: { lastAccess: 1 }, b: { lastAccess: 2 } };
    // Touch "a" at a new time so it is freshest; cap 1 must drop "b", not "a".
    const { index, evicted } = touchStoryCache(start, "a", 100, 1);
    expect(evicted).toEqual(["b"]);
    expect(Object.keys(index)).toEqual(["a"]);
  });

  it("defaults to DEFAULT_STORY_CACHE_MAX and keeps the launch library comfortably", () => {
    let index: StoryCacheIndex = {};
    for (let i = 0; i < 10; i++) index = touchStoryCache(index, `s${i}`, i).index;
    expect(Object.keys(index)).toHaveLength(10);
    expect(DEFAULT_STORY_CACHE_MAX).toBeGreaterThanOrEqual(10);
  });
});

describe("offline write outbox", () => {
  const write = (childId: number, slug: string, pageKey: string, queuedAt: number): PendingEndingWrite => ({
    kind: "recordEnding",
    childId,
    slug,
    pageKey,
    queuedAt,
  });

  it("keys a write by child, story, and page so identity is stable", () => {
    expect(outboxKey(write(1, "starlight-sail", "END_A", 5))).toBe("recordEnding:1:starlight-sail:END_A");
  });

  it("enqueues distinct writes", () => {
    let box: PendingEndingWrite[] = [];
    box = enqueueWrite(box, write(1, "starlight-sail", "END_A", 1));
    box = enqueueWrite(box, write(1, "starlight-sail", "END_B", 2));
    expect(box).toHaveLength(2);
  });

  it("de-duplicates the same ending queued twice offline (first queuedAt wins)", () => {
    let box: PendingEndingWrite[] = [];
    box = enqueueWrite(box, write(1, "starlight-sail", "END_A", 1));
    box = enqueueWrite(box, write(1, "starlight-sail", "END_A", 99));
    expect(box).toHaveLength(1);
    expect(box[0].queuedAt).toBe(1);
  });

  it("removes flushed writes by identity and leaves the rest", () => {
    const a = write(1, "starlight-sail", "END_A", 1);
    const b = write(2, "bean-whispering-woods", "END_C", 2);
    const box = [a, b];
    expect(removeWrites(box, [a])).toEqual([b]);
    expect(removeWrites(box, [a, b])).toEqual([]);
  });
});

describe("offline copy is warm and dash-free (UI rule 1)", () => {
  const noDashes = (s: string) => expect(s).not.toMatch(/[-‐-―−]/);

  it("has no hyphens, en dashes, or em dashes in any offline string", () => {
    noDashes(offlineBannerText());
    noDashes(offlineUnavailableText());
    noDashes(offlineSavedEndingText());
  });

  it("reads calmly and mentions saved stories", () => {
    expect(offlineBannerText().toLowerCase()).toContain("offline");
    expect(offlineBannerText().toLowerCase()).toContain("saved");
  });
});
