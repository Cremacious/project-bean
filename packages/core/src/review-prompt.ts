// packages/core/src/review-prompt.ts
//
// The platform-agnostic decision for the in-app "rate and review" prompt (issue
// #71). Everything here is pure and framework-free (no React Native, no
// expo-store-review, no I/O), so the "should we ask now?" rules (a genuine
// positive milestone, thresholds, cooldown, a lifetime cap) and the parent-facing
// copy are decided once and unit-tested, then called by the native review layer.
//
// Policy posture (Apple App Store Review 1.1.7 and Google Play): the app uses the
// OS-native review prompt only, never gates any feature behind a review, and never
// offers an incentive. The OS itself decides whether to actually show the dialog
// and rate-limits it; the caps below are a conservative EXTRA layer so we never
// nag, not an attempt to fight the OS limit. Ignoring the prompt has zero downside.

/**
 * A moment worth possibly asking at: the ending just reached, plus the child's
 * cumulative positive progress. `endingType` is the core ending enum
 * ("good" | "game_over" | ...); only a "good" ending is ever a prompt moment, so
 * a frustration or surprise ending can never trigger a review request.
 */
export type ReviewMilestone = {
  endingType: string;
  /** Cumulative good endings the child has found across all stories. */
  goodEndingsFound: number;
  /** Cumulative whole stories the child has completed. */
  storiesCompleted: number;
};

/**
 * Locally persisted memory of what we have already done, so we can cap and cool
 * down. JSON-serializable so the native layer can stash it in key/value storage
 * (AsyncStorage on device) and it survives app restarts.
 */
export type ReviewPromptState = {
  /** How many times we have asked the OS to present the review prompt. */
  timesRequested: number;
  /** Epoch ms of the last request, or null if we have never asked. */
  lastRequestedAt: number | null;
};

/** The starting state: never asked. */
export const INITIAL_REVIEW_PROMPT_STATE: ReviewPromptState = {
  timesRequested: 0,
  lastRequestedAt: null,
};

/** Tunable thresholds and frequency caps for the prompt. */
export type ReviewPromptConfig = {
  /** Ask only once the child has found at least this many good endings... */
  minGoodEndings: number;
  /** ...or completed at least this many whole stories (either one is enough). */
  minStoriesCompleted: number;
  /** Minimum time between two requests, in ms. */
  cooldownMs: number;
  /** Never ask more than this many times, ever. */
  maxPrompts: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sensible defaults: a real positive track record before the first ask, a long
 * cooldown between asks, and a small lifetime cap. Deliberately conservative so a
 * family is never nagged; the OS rate-limits on top of this.
 */
export const DEFAULT_REVIEW_PROMPT_CONFIG: ReviewPromptConfig = {
  minGoodEndings: 3,
  minStoriesCompleted: 2,
  cooldownMs: 120 * DAY_MS,
  maxPrompts: 3,
};

/** Why we did or did not ask, so callers can log and tests can assert precisely. */
export type ReviewPromptReason =
  | "eligible"
  | "not-a-good-ending"
  | "below-threshold"
  | "in-cooldown"
  | "cap-reached";

export type ReviewPromptDecision = { ask: boolean; reason: ReviewPromptReason };

/**
 * The single "should we ask for a review right now?" decision. Pure: give it the
 * milestone, the persisted state, the current time, and the config, and it tells
 * you whether to request the native prompt. The native layer only actually asks
 * the OS when this returns { ask: true }.
 */
export function shouldRequestReview(
  milestone: ReviewMilestone,
  state: ReviewPromptState,
  nowMs: number,
  config: ReviewPromptConfig = DEFAULT_REVIEW_PROMPT_CONFIG,
): ReviewPromptDecision {
  // 1. Never on a game over or any non-good ending: that is a frustration or a
  //    surprise moment, not a moment to ask a family for a five star review.
  if (milestone.endingType !== "good") return { ask: false, reason: "not-a-good-ending" };

  // 2. Only once there is a genuine track record of enjoyment: enough good endings
  //    found, or enough whole stories completed. Either signal is sufficient.
  const reachedThreshold =
    milestone.goodEndingsFound >= config.minGoodEndings ||
    milestone.storiesCompleted >= config.minStoriesCompleted;
  if (!reachedThreshold) return { ask: false, reason: "below-threshold" };

  // 3. Hard cap: after a few lifetime requests we stop asking entirely, so a family
  //    that never taps the prompt is never nagged again.
  if (state.timesRequested >= config.maxPrompts) return { ask: false, reason: "cap-reached" };

  // 4. Cooldown: leave a long gap between requests, on top of the OS's own limit.
  if (state.lastRequestedAt !== null && nowMs - state.lastRequestedAt < config.cooldownMs) {
    return { ask: false, reason: "in-cooldown" };
  }

  return { ask: true, reason: "eligible" };
}

/**
 * Advance the state after we have asked the OS to present the prompt. Pure: returns
 * a new state, never mutates the input. Recording the request (not whether the OS
 * actually showed it, which we cannot know) is what drives the cap and cooldown.
 */
export function recordReviewRequested(state: ReviewPromptState, nowMs: number): ReviewPromptState {
  return { timesRequested: state.timesRequested + 1, lastRequestedAt: nowMs };
}

/**
 * Parse persisted state from storage, falling back to the initial state on missing
 * or corrupt data. A bad blob must never crash a bedtime session, and must never
 * wrongly "reset" the cap to re-enable prompting, so anything unexpected is treated
 * as "never asked" only when it is clearly empty; malformed numeric fields are
 * sanitized field by field.
 */
export function parseReviewPromptState(raw: string | null | undefined): ReviewPromptState {
  if (!raw) return INITIAL_REVIEW_PROMPT_STATE;
  try {
    const v = JSON.parse(raw) as Partial<ReviewPromptState>;
    const timesRequested =
      typeof v.timesRequested === "number" && Number.isFinite(v.timesRequested) && v.timesRequested >= 0
        ? Math.floor(v.timesRequested)
        : 0;
    const lastRequestedAt =
      typeof v.lastRequestedAt === "number" && Number.isFinite(v.lastRequestedAt) ? v.lastRequestedAt : null;
    return { timesRequested, lastRequestedAt };
  } catch {
    return INITIAL_REVIEW_PROMPT_STATE;
  }
}

/**
 * Parent-facing copy for the manual "Rate Bedtime Quests" entry in settings (issue
 * #71 requirement 3) and any gentle surrounding text. Warm, high-contrast friendly,
 * and DASH-FREE per the app-wide copy rule (asserted in the tests). This is NOT a
 * custom star UI: the actual rating happens in the OS-native prompt or on the store
 * listing. No incentive is offered and nothing is gated (asserted in the tests).
 */
export type ReviewInviteCopy = {
  title: string;
  body: string;
  cta: string;
  unavailable: string;
};

export function reviewInviteCopy(): ReviewInviteCopy {
  return {
    title: "Enjoying Bedtime Quests?",
    body: "If bedtimes have felt a little cozier, a quick review helps other families find us. It is optional and takes just a moment.",
    cta: "Rate Bedtime Quests",
    unavailable: "You can rate Bedtime Quests in your app store any time.",
  };
}
