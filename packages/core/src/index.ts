// packages/core/src/index.ts
//
// Barrel entry for @bedtime-quests/core. Consumers may import from here for
// convenience (the Expo app does) or from a specific subpath such as
// "@bedtime-quests/core/stories/graph" (the web app does, mirroring the old
// lib/ layout). Everything exported here is platform-agnostic: no DOM, React,
// Next, React Native, or database imports live anywhere under this package.

// Story engine
export * from "./stories/graph";
export * from "./stories/from-input";
export * from "./stories/personalize";
export * from "./stories/covers";
export * from "./stories/validate";
export * from "./stories/access";
export * from "./stories/story-types";

// Story creation wizard (#86): planning, templates, placeholders, status, and
// completeness validation. Platform agnostic so a future end-user and native
// wizard reuse it. Web renders + persists; this is all the logic.
export * from "./stories/wizard/types";
export * from "./stories/wizard/endings";
export * from "./stories/wizard/placeholders";
export * from "./stories/wizard/templates";
export * from "./stories/wizard/plan-status";
export * from "./stories/wizard/validate-complete";

// Gameplay
export * from "./gameplay/progress";
export * from "./gameplay/collection";

// Entitlements & plans (pure rules and display)
export * from "./entitlements";
export * from "./plans";
export * from "./subscription-display";
export * from "./revenuecat-client";

// Reading preferences model
export * from "./reading-prefs";

// Help / FAQ content (parent-facing, shared by web and native so they never drift)
export * from "./faq";

// What's new / changelog (parent-facing history + unseen decision + new-story
// window, shared by web and native so the release notes never drift)
export * from "./changelog";

// First-time parent tutorial (gating decision + walkthrough copy, shared by web
// and native so the tour never drifts)
export * from "./onboarding";

// Validation
export * from "./validation";

// Privacy / consent model
export * from "./consent";
export * from "./parental-gate";
export * from "./pii-keys";

// Notifications (bedtime reminder) model
export * from "./notifications";

// Offline handling model (connectivity decision, read-through cache, write outbox)
export * from "./offline";

// Rate & review prompt model (positive-milestone gate, caps, parent-facing copy)
export * from "./review-prompt";

// Admin helpers
export * from "./admin/slugs";

/** Marker so platforms can confirm they are wired to the shared core. */
export const CORE_PACKAGE = "@bedtime-quests/core";
