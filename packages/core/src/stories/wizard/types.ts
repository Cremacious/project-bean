// packages/core/src/stories/wizard/types.ts
// Shared, platform-agnostic types for the story creation wizard (#86).
import type { AgeBand } from "../story-types";

/** An age band, or null when the author chose no band. */
export type AgeBandOrNone = AgeBand | null;

/** How many of each ending a story should have. */
export type EndingCounts = { good: number; surprise: number };

/** A suggested count with the inclusive range the author may pick within. */
export type EndingSuggestion = EndingCounts & {
  goodRange: [number, number];
  surpriseRange: [number, number];
};

/** The role a generated slot plays, used to pick a placeholder hint. */
export type SlotRole =
  | "opening"
  | "scene"
  | "pre_choice_scene"
  | "choice_prompt"
  | "good_ending"
  | "surprise_ending";

/** The template tags each branch so choice hints can differ. */
export type BranchFlavor = "calm" | "curious";

export type TemplateId =
  | "twin-trails"
  | "two-paths-meet"
  | "branching-tree"
  | "adventure-trail"
  | "blank";

/** A choice inside a scaffold. `flavor` is set only for fork choices. */
export type ScaffoldChoice = { toKey: string; flavor?: BranchFlavor };

/** One generated page slot. A scene has exactly one (Next) choice unless it is
 *  a terminal ending; a choice page has 2 or 3 fork choices. */
export type ScaffoldPage = {
  key: string;
  kind: "scene" | "choice";
  isEnding: boolean;
  endingKind?: "good" | "game_over";
  choices: ScaffoldChoice[];
};

/** The output of expanding a template: pages + the start page key. */
export type Scaffold = { startKey: string; pages: ScaffoldPage[] };
