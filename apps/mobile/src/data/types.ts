// apps/mobile/src/data/types.ts
//
// The interfaces the native UI is written against. Today they are satisfied by a
// local in-memory store (store.tsx) so the whole flow works offline for this UI
// port; each maps one-to-one onto a backend call the server must add later (see
// README). Keeping the UI behind these types means wiring the real API is a
// store swap, not a screen rewrite.
import type { ReadingFontId, ReadingSizeId } from "@bedtime-quests/core/reading-prefs";

export type ReadingMode = "read_to_me" | "can_read";

export type ChildProfile = {
  id: number;
  name: string;
  readingMode: ReadingMode;
  readerFont: ReadingFontId;
  readerFontSize: ReadingSizeId;
};

/** Story metadata for the library + collection cards (no page bodies). */
export type CatalogStory = {
  slug: string;
  title: string;
  description: string;
  ageBand: string | null;
  coverMotif: string | null;
  premium: boolean;
};
