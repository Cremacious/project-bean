// packages/core/src/onboarding.ts
//
// The single source of truth for the first-time parent tutorial (issue #73):
// both the WHEN (should we show it) and the WHAT (the walkthrough copy). It lives
// in the platform-agnostic core so the web first-run flow and the native app can
// render the SAME warm walkthrough and never drift, exactly like the FAQ content
// in faq.ts (this walkthrough is the short version of those answers).
//
// Pure data and pure functions only: no DOM, React, Next, React Native, or DB
// imports. The persisted "has the parent finished the tour" flag lives per parent
// account in the database; this module only decides what to do with it.
//
// Copy rules (docs/WORKFLOW.md): every string is warm, parent facing, high
// contrast when rendered, and DASH FREE (no em dashes, en dashes, or hyphens as
// punctuation). The parent is driving at bedtime, so the tone is encouraging and
// short, and the tour always ends by handing them into adding their child rather
// than at a dead end.

/** Icon key each platform maps to its own drawn glyph. Keeps this file art free. */
export type OnboardingIconKey =
  | "welcome"
  | "child"
  | "library"
  | "reading"
  | "choices"
  | "help";

/** One card in the walkthrough: a single idea, told simply. */
export type OnboardingStep = {
  /** Stable, dash-free id used for keys and analytics. */
  id: string;
  /** Which drawn glyph the platform shows for this step. */
  icon: OnboardingIconKey;
  /** The step heading, dash free. */
  title: string;
  /** The body as one or two short, dash-free paragraphs. */
  body: string[];
};

/**
 * The walkthrough in display order. Deliberately short (a handful of cards, one
 * idea each) so a tired parent can breeze through or skip. The topics mirror the
 * "Getting started" and "Reading and accessibility" FAQ sections so the two
 * surfaces always agree.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: "welcome",
    title: "Welcome to Bedtime Quests",
    body: [
      "Bedtime Quests is a library of cozy stories you and your little one read together. You read, they choose what happens next, and every choice leads somewhere new.",
      "Here is a quick tour. You can skip it any time and start reading right away.",
    ],
  },
  {
    id: "add-child",
    icon: "child",
    title: "Add your child",
    body: [
      "Add your child with just their first name. That name is all we need to make them the hero of every quest, and we never ask for anything else about them.",
      "You can add more than one child and switch between them at story time.",
    ],
  },
  {
    id: "pick-a-story",
    icon: "library",
    title: "Pick a story",
    body: [
      "Open the library and tap any story to begin. Each one shows an age band, like Ages 2 to 4, so you can find a good fit for tonight.",
      "Free stories are ready right away. Stories marked premium unlock with a subscription.",
    ],
  },
  {
    id: "reading-modes",
    icon: "reading",
    title: "Read your way",
    body: [
      "Choose Read to me and you read the pages aloud, or I can read and the text starts larger for a child reading on their own. You can switch any time.",
      "In the reading settings you can pick the font, including OpenDyslexic, and make the text bigger or smaller to suit young eyes.",
    ],
  },
  {
    id: "choices-endings",
    icon: "choices",
    title: "Choices and endings",
    body: [
      "At key moments the story offers a couple of choices and your child picks one. Different paths reach different endings, and each ending your child finds is saved in their collection.",
      "Some paths reach a gentle game over. Nothing is lost and nothing is scary. Your child is simply invited to try again and choose a new path.",
    ],
  },
  {
    id: "help",
    icon: "help",
    title: "You are all set",
    body: [
      "Grown up controls, help, and your subscription live in the menu, tucked behind a quick parent check so little hands stay in the story.",
      "That is everything. Let us add your first reader and begin tonight's quest.",
    ],
  },
];

/** Button and heading copy, kept here so web and native read identically. */
export const ONBOARDING_COPY = {
  /** Small eyebrow label above the walkthrough. */
  eyebrow: "Quick tour",
  /** Advance to the next card. */
  next: "Next",
  /** Go back a card. */
  back: "Back",
  /** Dismiss the whole tour without finishing. */
  skip: "Skip for now",
  /** Finish the tour on the last card; hands the parent into adding a child. */
  finish: "Add your child",
  /** Accessible label for the close control. */
  close: "Close the tour",
  /** The re-open entry shown in settings and help. */
  reopen: "Show me around",
  /** Short description for the re-open entry. */
  reopenHint: "Replay the quick tour of how Bedtime Quests works.",
  /** Progress announcement template for screen readers, e.g. "Step 2 of 6". */
  progressLabel: (current: number, total: number) => `Step ${current} of ${total}`,
} as const;

/**
 * A parent's onboarding state, as needed to decide whether to auto show the tour.
 * `onboardingCompletedAt` is whatever the store hands back for the completion
 * timestamp: a Date, an ISO string, epoch ms, or null/undefined when the parent
 * has never finished or skipped the tour.
 */
export type OnboardingGateInput = {
  onboardingCompletedAt: Date | string | number | null | undefined;
  /** Whether the parent already has at least one child profile. */
  hasChildren: boolean;
};

/** True once the parent has finished or skipped the tour (any non-empty value). */
export function isOnboardingCompleted(
  onboardingCompletedAt: OnboardingGateInput["onboardingCompletedAt"],
): boolean {
  return onboardingCompletedAt !== null && onboardingCompletedAt !== undefined;
}

/**
 * Whether to AUTO show the tour on landing. We only greet a genuinely new parent:
 * one who has not finished or skipped the tour AND has no children yet. A
 * returning parent (who already has a child) is never interrupted, even if the
 * completion flag was never set (e.g. an account created before this feature).
 *
 * Re-opening the tour later from settings ignores this gate on purpose: the parent
 * asked for it, so it always opens.
 */
export function shouldAutoShowOnboarding(input: OnboardingGateInput): boolean {
  return !isOnboardingCompleted(input.onboardingCompletedAt) && !input.hasChildren;
}

/** Total number of steps, handy for progress indicators. */
export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;
