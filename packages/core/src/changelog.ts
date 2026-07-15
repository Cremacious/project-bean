// packages/core/src/changelog.ts
//
// The single source of truth for the parent-facing "What's new" changelog (issue
// #74). It lives in the platform-agnostic core so the web /whats-new page, the
// in-app "What's new" panel, and (later) the native app all render the SAME
// history and can never drift, exactly like the FAQ content in faq.ts and the
// tour copy in onboarding.ts.
//
// Pure data and pure functions only: no DOM, React, Next, React Native, or DB
// imports. The persisted "which entry has this parent already seen" marker lives
// per parent account in the database; this module only decides what to do with it
// (see hasUnseenWhatsNew) and how long a freshly published story counts as new
// (see isNewStory).
//
// Copy rules (docs/WORKFLOW.md): every string here is warm, parent facing, high
// contrast when rendered, and DASH FREE (no em dashes, en dashes, or hyphens as
// punctuation). Entries describe what actually shipped, in plain language a
// parent understands, never internal issue numbers or jargon.
//
// HOW TO ADD AN ENTRY EACH RELEASE (also documented in docs/STORY-CADENCE.md):
// prepend one ChangelogEntry to the top of CHANGELOG (newest first). Give it a
// fresh, stable `id` (for example "2026-08"), today's `date` as an ISO
// YYYY-MM-DD string, a short human `title`, and fill whichever of the three
// groups apply: `newStories`, `improvements`, `fixes`. Leave a group off if it is
// empty. That one edit updates the public page, the in-app panel, and the unseen
// dot for every parent at once.

/** A dated release note. Groups are optional so an entry only carries what shipped. */
export type ChangelogEntry = {
  /**
   * A stable, dash-free id, unique across the whole changelog (for example
   * "2026-07"). It is what the per-parent "last seen" marker stores, so it must
   * never change once published or a parent would see the entry as new again.
   */
  id: string;
  /** The release date as an ISO YYYY-MM-DD string. Used for display and ordering. */
  date: string;
  /** A short, human title for the entry, for example "July 2026". Dash free. */
  title: string;
  /** New stories added to the library this release. */
  newStories?: string[];
  /** Notable improvements and additions. */
  improvements?: string[];
  /** Fixes for things that were not working right. */
  fixes?: string[];
};

/**
 * The changelog in display order, NEWEST FIRST. CHANGELOG[0] is always the most
 * recent release. Prepend new entries here (see the header note). The entries
 * below are real shipped history; keep them truthful and parent facing.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-07",
    date: "2026-07-15",
    title: "July 2026",
    newStories: [
      "Fresh bedtime quests joined the library, spread across the age bands so every reader finds something new.",
    ],
    improvements: [
      "A friendly first time tour now welcomes new grown ups and shows how reading together works.",
      "A new Help and answers page covers the questions families ask us most, with a quick way to reach our team.",
      "You can now tell us you love a quest with a gentle in app rating prompt, only ever after a happy ending.",
    ],
  },
  {
    id: "2026-06",
    date: "2026-06-20",
    title: "June 2026",
    improvements: [
      "Stories you have already opened now keep reading when the internet drops, so a bedtime quest works on a trip or when the signal fades.",
      "Endings your child reaches while offline are saved on the device and quietly catch up the next time you are online.",
    ],
    fixes: [
      "Smoothed out a few rough edges so pages turn and choices land more reliably on older phones.",
    ],
  },
];

/**
 * The most recent changelog entry, or null when the changelog is empty. Its id is
 * what a parent's "last seen" marker is compared against.
 */
export function latestChangelogEntry(): ChangelogEntry | null {
  return CHANGELOG[0] ?? null;
}

/**
 * Whether there is a "What's new" entry this parent has not seen yet, used to
 * decide whether to show the unobtrusive dot on the menu.
 *
 * - `latestId` is the id of the newest entry (latestChangelogEntry()?.id), or
 *   null when the changelog is empty.
 * - `lastSeenId` is the entry id the parent most recently opened the panel on, or
 *   null/undefined when they have never opened it.
 *
 * A parent who has never opened the panel sees the dot as soon as there is any
 * entry. Once they open it, the marker is set to the latest id and the dot clears
 * until a newer entry is added. This never blocks the app; it only drives a dot.
 */
export function hasUnseenWhatsNew(
  latestId: string | null,
  lastSeenId: string | null | undefined,
): boolean {
  if (!latestId) return false;
  return latestId !== lastSeenId;
}

/** How many days a freshly published story wears the "New" badge in the library. */
export const NEW_STORY_WINDOW_DAYS = 14;

function toTime(value: Date | string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Whether a story counts as newly published, so the library can badge it "New".
 * True when the story was published within the last `windowDays` days (inclusive)
 * relative to `now`. A story with no publish date is never new. A publish time in
 * the (near) future, from clock skew, still counts as new rather than being hidden.
 *
 * Both times accept a Date, an ISO string, or epoch milliseconds, mirroring how
 * the store hands timestamps back.
 */
export function isNewStory(
  publishedAt: Date | string | number | null | undefined,
  now: Date | string | number,
  windowDays: number = NEW_STORY_WINDOW_DAYS,
): boolean {
  const published = toTime(publishedAt);
  const current = toTime(now);
  if (published === null || current === null) return false;
  const ageMs = current - published;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  return ageMs <= windowMs;
}

/** Panel and page copy, kept here so web and native read identically. Dash free. */
export const WHATS_NEW_COPY = {
  /** The title of the in-app panel and the public page. */
  title: "What's new",
  /** A one line intro shown under the title. */
  intro: "The latest stories and improvements we have added to Bedtime Quests.",
  /** The menu item that opens the panel. */
  menuItem: "What's new",
  /** Accessible label for the unseen dot. */
  unseenLabel: "New updates to read",
  /** Close the panel. */
  close: "Close",
  /** Group headings, dash free. */
  groups: {
    newStories: "New stories",
    improvements: "Improvements",
    fixes: "Fixes",
  },
  /** Shown when there is nothing to list yet (defensive; the changelog is seeded). */
  empty: "Nothing new just yet. Check back soon for fresh quests.",
} as const;
