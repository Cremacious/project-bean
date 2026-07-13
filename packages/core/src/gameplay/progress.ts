// lib/gameplay/progress.ts
export type EndingRef = { pageId: number; endingType: string };
export type StoryProgress = { goodFound: number; goodTotal: number; complete: boolean; surprises: number };

export function computeStoryProgress(endings: EndingRef[], foundPageIds: number[]): StoryProgress {
  const found = new Set(foundPageIds);
  const good = endings.filter((e) => e.endingType === "good");
  const goodFound = good.filter((e) => found.has(e.pageId)).length;
  const surprises = endings.filter((e) => e.endingType === "game_over" && found.has(e.pageId)).length;
  const goodTotal = good.length;
  return { goodFound, goodTotal, complete: goodTotal > 0 && goodFound >= goodTotal, surprises };
}

export type BadgeSummary = { goodEndingsFound: number; storiesCompleted: number; storiesTotal: number; surprisesFound: number };
export type Badge = { id: string; label: string; icon: string; earned: boolean };

// Labels follow rule 1 (no dashes).
export const BADGES: { id: string; label: string; icon: string; test: (s: BadgeSummary) => boolean }[] = [
  { id: "first-ending", label: "First ending", icon: "🌟", test: (s) => s.goodEndingsFound >= 1 },
  { id: "first-story", label: "First story finished", icon: "🏆", test: (s) => s.storiesCompleted >= 1 },
  { id: "three-stories", label: "3 stories finished", icon: "📚", test: (s) => s.storiesCompleted >= 3 },
  { id: "surprise", label: "Found a surprise", icon: "🙈", test: (s) => s.surprisesFound >= 1 },
  { id: "ten-endings", label: "10 endings found", icon: "🔟", test: (s) => s.goodEndingsFound >= 10 },
  { id: "all-stories", label: "Collected them all", icon: "👑", test: (s) => s.storiesTotal > 0 && s.storiesCompleted >= s.storiesTotal },
];

export function deriveBadges(summary: BadgeSummary): Badge[] {
  return BADGES.map(({ id, label, icon, test }) => ({ id, label, icon, earned: test(summary) }));
}
