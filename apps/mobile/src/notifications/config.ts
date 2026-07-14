// apps/mobile/src/notifications/config.ts
//
// Notification configuration read from Expo PUBLIC env / app config (issue #56).
// Nothing secret lives here and `.env.local` is never read: the app runs fully
// with none of these set (it schedules a local, on-device reminder that needs no
// credentials at all). These values only matter for the DEFERRED remote-push seam
// and for the Android channel identity.
//
// COPPA (docs/COMPLIANCE-COPPA.md): none of this touches child data.

/** The Android notification channel id our reminder posts to (Android 8+). */
export const REMINDER_CHANNEL_ID = "bedtime-reminders";

/**
 * A stable marker put in every reminder's payload so the app can find and replace
 * exactly its own scheduled reminder without disturbing anything else, and so a
 * tap can be routed to the right screen. It is not personal data.
 */
export const REMINDER_KIND = "bedtime_reminder";

/** The in-app screen a reminder tap deep-links to (issue #56 requirement 3). */
export const REMINDER_TAP_SCREEN = "library";

/**
 * The EAS project id required by `getExpoPushTokenAsync` for REMOTE push. Read
 * from Expo public config; absent today because remote push is deferred, which is
 * one more reason the app ships local reminders only. When present it comes from
 * `app.json` extra.eas.projectId, surfaced as EXPO_PUBLIC_EAS_PROJECT_ID.
 */
export function easProjectId(): string | null {
  const id = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  return id && id.length > 0 ? id : null;
}
