// packages/core/src/changelog.test.ts
import { describe, it, expect } from "vitest";
import {
  CHANGELOG,
  latestChangelogEntry,
  hasUnseenWhatsNew,
  isNewStory,
  NEW_STORY_WINDOW_DAYS,
  WHATS_NEW_COPY,
} from "./changelog";

const DAY = 24 * 60 * 60 * 1000;

describe("CHANGELOG data", () => {
  it("is non-empty and ordered newest first by date", () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    for (let i = 1; i < CHANGELOG.length; i++) {
      const prev = new Date(CHANGELOG[i - 1].date).getTime();
      const cur = new Date(CHANGELOG[i].date).getTime();
      expect(prev).toBeGreaterThanOrEqual(cur);
    }
  });

  it("has a unique, stable id and a valid ISO date on every entry", () => {
    const ids = new Set<string>();
    for (const entry of CHANGELOG) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/); // dash-free-slug shape
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(Number.isNaN(new Date(entry.date).getTime())).toBe(false);
    }
  });

  it("never uses a dash as punctuation in displayed copy (UI rule 1)", () => {
    // Collect every parent-facing string in the changelog and the shared copy.
    const strings: string[] = [];
    for (const entry of CHANGELOG) {
      strings.push(entry.title);
      strings.push(...(entry.newStories ?? []));
      strings.push(...(entry.improvements ?? []));
      strings.push(...(entry.fixes ?? []));
    }
    strings.push(
      WHATS_NEW_COPY.title,
      WHATS_NEW_COPY.intro,
      WHATS_NEW_COPY.menuItem,
      WHATS_NEW_COPY.empty,
    );
    for (const s of strings) {
      // No em dash, en dash, or a hyphen used as spaced punctuation.
      expect(s).not.toMatch(/[—–]/);
      expect(s).not.toMatch(/ - /);
    }
  });
});

describe("latestChangelogEntry", () => {
  it("returns the first (newest) entry", () => {
    expect(latestChangelogEntry()).toBe(CHANGELOG[0]);
  });
});

describe("hasUnseenWhatsNew", () => {
  it("is true when the parent has never opened the panel and there is an entry", () => {
    expect(hasUnseenWhatsNew("2026-07", null)).toBe(true);
    expect(hasUnseenWhatsNew("2026-07", undefined)).toBe(true);
  });

  it("is false once the parent has seen the latest entry", () => {
    expect(hasUnseenWhatsNew("2026-07", "2026-07")).toBe(false);
  });

  it("is true again when a newer entry appears after the last seen one", () => {
    expect(hasUnseenWhatsNew("2026-08", "2026-07")).toBe(true);
  });

  it("is false when the changelog is empty, whatever the marker", () => {
    expect(hasUnseenWhatsNew(null, null)).toBe(false);
    expect(hasUnseenWhatsNew(null, "2026-07")).toBe(false);
  });
});

describe("isNewStory", () => {
  const now = new Date("2026-07-15T00:00:00.000Z");

  it("badges a story published today", () => {
    expect(isNewStory(now, now)).toBe(true);
  });

  it("badges a story published within the window", () => {
    expect(isNewStory(new Date(now.getTime() - 1 * DAY), now)).toBe(true);
    expect(isNewStory(new Date(now.getTime() - 13 * DAY), now)).toBe(true);
  });

  it("badges a story exactly at the window boundary (inclusive)", () => {
    expect(isNewStory(new Date(now.getTime() - NEW_STORY_WINDOW_DAYS * DAY), now)).toBe(true);
  });

  it("does not badge a story older than the window", () => {
    expect(isNewStory(new Date(now.getTime() - (NEW_STORY_WINDOW_DAYS + 1) * DAY), now)).toBe(false);
    expect(isNewStory(new Date(now.getTime() - 60 * DAY), now)).toBe(false);
  });

  it("respects a custom window", () => {
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
    expect(isNewStory(sevenDaysAgo, now, 3)).toBe(false);
    expect(isNewStory(sevenDaysAgo, now, 10)).toBe(true);
  });

  it("treats a just-published (or slightly future, from clock skew) story as new", () => {
    expect(isNewStory(new Date(now.getTime() + 1 * DAY), now)).toBe(true);
  });

  it("accepts ISO strings and epoch milliseconds", () => {
    expect(isNewStory("2026-07-10", now)).toBe(true);
    expect(isNewStory(now.getTime() - 2 * DAY, now.getTime())).toBe(true);
    expect(isNewStory("2026-05-01", now)).toBe(false);
  });

  it("is never new without a publish date or with an unparseable one", () => {
    expect(isNewStory(null, now)).toBe(false);
    expect(isNewStory(undefined, now)).toBe(false);
    expect(isNewStory("not-a-date", now)).toBe(false);
  });
});
