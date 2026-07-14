import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_COUNT,
  ONBOARDING_COPY,
  isOnboardingCompleted,
  shouldAutoShowOnboarding,
} from "./onboarding";

describe("shouldAutoShowOnboarding", () => {
  it("shows for a brand new parent: no children, never completed", () => {
    expect(
      shouldAutoShowOnboarding({ onboardingCompletedAt: null, hasChildren: false }),
    ).toBe(true);
    expect(
      shouldAutoShowOnboarding({ onboardingCompletedAt: undefined, hasChildren: false }),
    ).toBe(true);
  });

  it("does NOT show once the parent has finished or skipped the tour", () => {
    // A concrete completion timestamp in any accepted shape suppresses the tour.
    for (const stamp of [new Date(), new Date().toISOString(), Date.now()]) {
      expect(
        shouldAutoShowOnboarding({ onboardingCompletedAt: stamp, hasChildren: false }),
      ).toBe(false);
    }
  });

  it("does NOT show for a returning parent who already has a child", () => {
    // Even with the flag unset (e.g. an account predating this feature), an
    // existing family is never interrupted.
    expect(
      shouldAutoShowOnboarding({ onboardingCompletedAt: null, hasChildren: true }),
    ).toBe(false);
    expect(
      shouldAutoShowOnboarding({ onboardingCompletedAt: new Date(), hasChildren: true }),
    ).toBe(false);
  });
});

describe("isOnboardingCompleted", () => {
  it("is false only for null/undefined", () => {
    expect(isOnboardingCompleted(null)).toBe(false);
    expect(isOnboardingCompleted(undefined)).toBe(false);
  });

  it("is true for any real timestamp value", () => {
    expect(isOnboardingCompleted(new Date())).toBe(true);
    expect(isOnboardingCompleted("2026-07-14T00:00:00.000Z")).toBe(true);
    expect(isOnboardingCompleted(0)).toBe(true); // epoch 0 is still "completed"
  });
});

describe("onboarding content", () => {
  it("is a short walkthrough (a few cards, not a slideshow)", () => {
    expect(ONBOARDING_STEP_COUNT).toBe(ONBOARDING_STEPS.length);
    expect(ONBOARDING_STEPS.length).toBeGreaterThanOrEqual(4);
    expect(ONBOARDING_STEPS.length).toBeLessThanOrEqual(7);
  });

  it("covers every required topic from issue #73", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    for (const id of [
      "add-child",
      "pick-a-story",
      "reading-modes",
      "choices-endings",
      "help",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("has a stable, unique id and non-empty body for each step", () => {
    const ids = new Set<string>();
    for (const step of ONBOARDING_STEPS) {
      expect(step.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(step.id)).toBe(false);
      ids.add(step.id);
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
      expect(step.body.every((p) => p.trim().length > 0)).toBe(true);
    }
  });

  it("contains no dashes in any displayed copy (UI rule 1)", () => {
    // Em dash, en dash, and hyphen used as punctuation are all banned in copy.
    const banned = /[–—-]/;
    const strings: string[] = [];
    for (const step of ONBOARDING_STEPS) {
      strings.push(step.title, ...step.body);
    }
    strings.push(
      ONBOARDING_COPY.eyebrow,
      ONBOARDING_COPY.next,
      ONBOARDING_COPY.back,
      ONBOARDING_COPY.skip,
      ONBOARDING_COPY.finish,
      ONBOARDING_COPY.close,
      ONBOARDING_COPY.reopen,
      ONBOARDING_COPY.reopenHint,
      ONBOARDING_COPY.progressLabel(2, 6),
    );
    for (const s of strings) {
      expect(banned.test(s), `dash found in: "${s}"`).toBe(false);
    }
  });
});
