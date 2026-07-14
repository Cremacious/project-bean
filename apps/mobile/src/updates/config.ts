// apps/mobile/src/updates/config.ts
//
// OTA update strategy + copy (issue #67). Nothing secret lives here and `.env.local`
// is never read. The real update URL, channel, and runtime version are baked into
// the native build by EAS (app.json `updates` + `runtimeVersion`, and the build
// profile's `channel` in eas.json); the app code below only decides WHEN to act and
// WHAT to say. All copy is high-contrast-ready and dash-free (UI rules 1 and 3).

/**
 * The update lifecycle the context surfaces:
 *  - "unsupported": OTA is not active for this build (Expo Go, dev client, this repo,
 *    CI). Nothing to check; the notice never shows.
 *  - "checking": asking the server on cold launch.
 *  - "downloading": a compatible update exists and is being fetched in the background.
 *  - "ready": an update is downloaded and will apply on the NEXT cold start.
 *  - "upToDate": the server had nothing newer.
 */
export type UpdateStatus = "unsupported" | "checking" | "downloading" | "ready" | "upToDate";

/**
 * Simulation override for QA: set EXPO_PUBLIC_FORCE_UPDATE_READY=1 to force the
 * "update ready" state on top of ANY provider, so the on-brand notice is
 * exercisable in Expo Go without a real OTA build (mirrors EXPO_PUBLIC_FORCE_OFFLINE
 * for the offline UX in issue #66).
 */
export function forcedUpdateReady(): boolean {
  return process.env.EXPO_PUBLIC_FORCE_UPDATE_READY === "1";
}

/**
 * Copy for the optional "update ready" notice. It is purely reassuring: the update
 * applies by itself the next time the app is opened cold, so no one has to do
 * anything. The action is offered, never forced, and never appears mid-story.
 */
export const updateReadyCopy = {
  emoji: "✨",
  title: "A fresh update is ready",
  // Dash-free (UI rule 1). Explains the safe, automatic behavior first.
  body: "New stories and improvements will be added the next time you open Bedtime Quests. You can also add them now.",
  /** The optional, user-initiated action label (applies the update by reloading). */
  action: "Add them now",
} as const;
