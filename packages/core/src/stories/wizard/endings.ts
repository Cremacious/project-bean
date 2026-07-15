// packages/core/src/stories/wizard/endings.ts
import type { AgeBandOrNone, EndingSuggestion } from "./types";

/** Suggested ending counts per age band, with author-adjustable ranges.
 *  Grounded in docs/AUTHORING.md (aim for 2 to 4 good, 0 to 2 surprise). */
export function suggestEndingCounts(ageBand: AgeBandOrNone): EndingSuggestion {
  switch (ageBand) {
    case "2-4": return { good: 2, surprise: 1, goodRange: [2, 3], surpriseRange: [0, 2] };
    case "5-7": return { good: 3, surprise: 1, goodRange: [2, 4], surpriseRange: [0, 2] };
    case "8+":  return { good: 3, surprise: 2, goodRange: [3, 4], surpriseRange: [0, 3] };
    default:    return { good: 3, surprise: 1, goodRange: [1, 4], surpriseRange: [0, 2] };
  }
}

/** Minimum number of choice points a reader passes before a good ending. */
export function minChoicesToGoodEnding(ageBand: AgeBandOrNone): number {
  switch (ageBand) {
    case "2-4": return 3;
    case "5-7": return 5;
    case "8+":  return 7;
    default:    return 5;
  }
}
