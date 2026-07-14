import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVIEW_PROMPT_CONFIG,
  INITIAL_REVIEW_PROMPT_STATE,
  parseReviewPromptState,
  recordReviewRequested,
  reviewInviteCopy,
  shouldRequestReview,
  type ReviewMilestone,
  type ReviewPromptState,
} from "./review-prompt";

// Any dash used as punctuation is banned in user-facing copy (docs/WORKFLOW.md
// rule 1): hyphen-minus, non-breaking hyphen, figure dash, en/em/horizontal bar.
const DASHES = /[-‐‑‒–—―]/;
// A fixed epoch ms; every test passes time in explicitly so nothing reads the clock.
const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

// A milestone that clears the default threshold (>= 3 good endings) on a good ending.
const good = (over: Partial<ReviewMilestone> = {}): ReviewMilestone => ({
  endingType: "good",
  goodEndingsFound: 3,
  storiesCompleted: 1,
  ...over,
});

describe("shouldRequestReview — positive milestone gate", () => {
  it("asks on a good ending once the threshold is met and nothing has been asked yet", () => {
    expect(shouldRequestReview(good(), INITIAL_REVIEW_PROMPT_STATE, NOW)).toEqual({ ask: true, reason: "eligible" });
  });

  it("never asks on a game over, even when the threshold is far exceeded", () => {
    const d = shouldRequestReview(
      good({ endingType: "game_over", goodEndingsFound: 99, storiesCompleted: 99 }),
      INITIAL_REVIEW_PROMPT_STATE,
      NOW,
    );
    expect(d).toEqual({ ask: false, reason: "not-a-good-ending" });
  });

  it("never asks on any other non-good ending type", () => {
    const d = shouldRequestReview(good({ endingType: "neutral" }), INITIAL_REVIEW_PROMPT_STATE, NOW);
    expect(d).toEqual({ ask: false, reason: "not-a-good-ending" });
  });
});

describe("shouldRequestReview — threshold", () => {
  it("does not ask before enough good endings or completed stories", () => {
    const d = shouldRequestReview(good({ goodEndingsFound: 1, storiesCompleted: 0 }), INITIAL_REVIEW_PROMPT_STATE, NOW);
    expect(d).toEqual({ ask: false, reason: "below-threshold" });
  });

  it("accepts completing enough whole stories as an alternative to good-ending count", () => {
    const d = shouldRequestReview(good({ goodEndingsFound: 1, storiesCompleted: 2 }), INITIAL_REVIEW_PROMPT_STATE, NOW);
    expect(d).toEqual({ ask: true, reason: "eligible" });
  });
});

describe("shouldRequestReview — cooldown", () => {
  it("does not ask again within the cooldown window", () => {
    const state: ReviewPromptState = { timesRequested: 1, lastRequestedAt: NOW - DAY };
    expect(shouldRequestReview(good(), state, NOW)).toEqual({ ask: false, reason: "in-cooldown" });
  });

  it("asks again once the cooldown has fully elapsed", () => {
    const state: ReviewPromptState = {
      timesRequested: 1,
      lastRequestedAt: NOW - (DEFAULT_REVIEW_PROMPT_CONFIG.cooldownMs + 1),
    };
    expect(shouldRequestReview(good(), state, NOW)).toEqual({ ask: true, reason: "eligible" });
  });
});

describe("shouldRequestReview — lifetime cap (already shown enough)", () => {
  it("stops asking once the max number of prompts has been reached", () => {
    const state: ReviewPromptState = {
      timesRequested: DEFAULT_REVIEW_PROMPT_CONFIG.maxPrompts,
      lastRequestedAt: NOW - 10 * DEFAULT_REVIEW_PROMPT_CONFIG.cooldownMs,
    };
    expect(shouldRequestReview(good(), state, NOW)).toEqual({ ask: false, reason: "cap-reached" });
  });

  it("treats the cap as final at a fresh, otherwise-eligible milestone", () => {
    const state: ReviewPromptState = { timesRequested: DEFAULT_REVIEW_PROMPT_CONFIG.maxPrompts + 5, lastRequestedAt: null };
    expect(shouldRequestReview(good(), state, NOW).reason).toBe("cap-reached");
  });
});

describe("recordReviewRequested", () => {
  it("increments the count and stamps the time", () => {
    expect(recordReviewRequested(INITIAL_REVIEW_PROMPT_STATE, NOW)).toEqual({ timesRequested: 1, lastRequestedAt: NOW });
  });

  it("is pure (does not mutate the input state)", () => {
    const before: ReviewPromptState = { timesRequested: 1, lastRequestedAt: NOW - DAY };
    recordReviewRequested(before, NOW);
    expect(before).toEqual({ timesRequested: 1, lastRequestedAt: NOW - DAY });
  });

  it("a recorded request then blocks the next milestone via cooldown", () => {
    const next = recordReviewRequested(INITIAL_REVIEW_PROMPT_STATE, NOW);
    expect(shouldRequestReview(good(), next, NOW + DAY)).toEqual({ ask: false, reason: "in-cooldown" });
  });
});

describe("parseReviewPromptState", () => {
  it("returns the initial state for null, empty, or corrupt input", () => {
    expect(parseReviewPromptState(null)).toEqual(INITIAL_REVIEW_PROMPT_STATE);
    expect(parseReviewPromptState("")).toEqual(INITIAL_REVIEW_PROMPT_STATE);
    expect(parseReviewPromptState("not json")).toEqual(INITIAL_REVIEW_PROMPT_STATE);
  });

  it("round-trips a valid state", () => {
    const state: ReviewPromptState = { timesRequested: 2, lastRequestedAt: NOW };
    expect(parseReviewPromptState(JSON.stringify(state))).toEqual(state);
  });

  it("sanitizes out-of-range or wrong-typed fields", () => {
    expect(parseReviewPromptState(JSON.stringify({ timesRequested: -3, lastRequestedAt: "nope" }))).toEqual(
      INITIAL_REVIEW_PROMPT_STATE,
    );
    expect(parseReviewPromptState(JSON.stringify({ timesRequested: 2.9, lastRequestedAt: NOW }))).toEqual({
      timesRequested: 2,
      lastRequestedAt: NOW,
    });
  });
});

describe("reviewInviteCopy", () => {
  it("provides the pieces the settings UI needs, all non-empty", () => {
    const c = reviewInviteCopy();
    for (const s of [c.title, c.body, c.cta, c.unavailable]) expect(s.length).toBeGreaterThan(0);
  });

  it("contains no dashes (app-wide copy rule)", () => {
    const c = reviewInviteCopy();
    for (const s of [c.title, c.body, c.cta, c.unavailable]) expect(s).not.toMatch(DASHES);
  });

  it("offers no incentive wording (store policy forbids incentivized reviews)", () => {
    const c = reviewInviteCopy();
    const blob = `${c.title} ${c.body} ${c.cta} ${c.unavailable}`.toLowerCase();
    for (const banned of ["reward", "free", "unlock", "gift", "coin", "bonus", "discount"]) {
      expect(blob).not.toContain(banned);
    }
  });
});
