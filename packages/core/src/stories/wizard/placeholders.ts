// packages/core/src/stories/wizard/placeholders.ts
// Hand-written, deterministic hint lookup. No AI, no network. Every string is
// dash free (app-wide rule) and is shown as ghost text, never saved.
import type { AgeBandOrNone, SlotRole, BranchFlavor } from "./types";

const HINTS: Record<SlotRole, string[]> = {
  opening: [
    "Introduce {{name}} and a companion, and set a cozy scene. Where are they as the story begins?",
  ],
  scene: [
    "Describe what they find here. Keep it calm and short.",
    "A gentle beat of the journey. What do {{name}} and their friend notice now?",
    "Slow the moment down. A soft, sleepy detail before the next step.",
  ],
  pre_choice_scene: [
    "Set up the decision. End on a gentle question for {{name}}.",
    "Two paths appear. Describe them, then ask which way to go.",
  ],
  choice_prompt: [
    "Offer two different paths, like a calm one and a curious one.",
  ],
  good_ending: [
    "Land somewhere warm and sleepy. A happy finish to collect.",
    "Wind all the way down to cozy and calm. A lovely place to end.",
  ],
  surprise_ending: [
    "A silly, gentle oops that loops back. Nothing scary.",
  ],
};

/** Pick a dash-free instructional hint for a slot. Deterministic in `depth`. */
export function placeholderFor(role: SlotRole, _ageBand: AgeBandOrNone, depth: number): string {
  const bucket = HINTS[role];
  const i = ((depth % bucket.length) + bucket.length) % bucket.length;
  return bucket[i];
}

/** A starter hint for a fork choice label, by branch flavor. */
export function choiceLabelHint(flavor: BranchFlavor): string {
  return flavor === "calm" ? "e.g. Curl up and rest a while" : "e.g. Peek around the corner";
}
