// Shared fixtures for the E2E journeys (issue #41).

// One long-lived parent + child that the authenticated journeys reuse via a saved
// storage state (see auth.setup.ts). The email is stable so re-runs against the dev
// Neon database reuse the same account instead of piling up new ones; auth.setup.ts
// signs up on first run and signs in thereafter.
export const SHARED_PARENT = {
  name: "Test Parent",
  email: "e2e-shared-parent@example.com",
  password: "bedtime-e2e-pass-123",
};

// A distinctive child NAME so we can prove {{name}} personalization in a story.
export const SHARED_CHILD_NAME = "Luna";

// Where auth.setup.ts writes the signed-in browser state the authed specs load.
export const STORAGE_STATE = "e2e/.auth/parent.json";

// A free sampler story (premium: false) any signed-in parent can read.
export const FREE_STORY = {
  slug: "starlight-sail",
  title: "Pip and the Starlight Sea",
};

// A premium story (premium defaults true) that a free-tier parent cannot read, so
// they get the paywall instead.
export const PREMIUM_STORY = {
  slug: "fern-lantern-woods",
  title: "Fern and the Lantern Woods",
};
