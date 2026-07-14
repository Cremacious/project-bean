// apps/mobile/src/notifications/types.ts
//
// The notifications seam (issue #56). The settings UI and the reminders context
// are written against this NotificationsProvider interface, satisfied at runtime
// by either the real Expo provider (expo-notifications present) or an in-memory
// mock (Expo Go without the module / CI / this repo). This mirrors the billing
// seam (src/billing/types.ts): the UI depends only on the interface, so which
// implementation is used is a factory choice, never a screen rewrite.
//
// Scope: the ONLY notification this app sends today is a gentle, on-device, daily
// bedtime reminder aimed at the PARENT (docs/COMPLIANCE-COPPA.md section 6). No
// remote push, no server, no personal data. The remote-push seam (getPushToken)
// is intentionally present but returns null and is deferred; see README.
import type { ReminderTime } from "@bedtime-quests/core/notifications";

/**
 * The OS notification permission, reduced to the three states the UI cares about.
 *  - granted:      the parent allowed notifications; we may schedule.
 *  - denied:       the parent (or the OS) said no. We must not nag; the settings
 *                  screen offers a path to the OS settings instead.
 *  - undetermined: never asked yet. Flipping the toggle on triggers the OS prompt.
 */
export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface NotificationsProvider {
  /** Which implementation this is, for logs and the settings screen note. */
  readonly name: "expo" | "mock";

  /**
   * Set up any platform prerequisites (the Android notification channel, the
   * foreground presentation handler). Safe to call more than once.
   */
  prepare(): Promise<void>;

  /** Read the current OS permission without prompting. */
  getPermissionStatus(): Promise<PermissionStatus>;

  /**
   * Ask the OS for permission. Called ONLY after the parent has seen in-app
   * context explaining what the reminder is for (issue #56 requirement 1). If the
   * parent already decided, the OS resolves immediately without a new prompt.
   */
  requestPermission(): Promise<PermissionStatus>;

  /**
   * Schedule (or reschedule) the single daily reminder at `time`. Any existing
   * reminder is replaced first, so there is never more than one. Returns true when
   * a reminder is now scheduled, false when it could not be (e.g. no permission).
   */
  scheduleDailyReminder(time: ReminderTime): Promise<boolean>;

  /** Remove the daily reminder if one is scheduled. Safe when none exists. */
  cancelReminder(): Promise<void>;

  /** Whether a daily reminder is currently scheduled on the device. */
  isReminderScheduled(): Promise<boolean>;

  /**
   * Subscribe to reminder taps so the app can deep-link (issue #56 requirement 3:
   * a tap opens a sensible screen, the library). Returns an unsubscribe function.
   */
  addResponseListener(onTap: () => void): () => void;

  /**
   * Remote-push seam, DEFERRED (issue #56 requirement 2). Returns null today: the
   * app ships local reminders only, so no push token is registered and none is
   * stored. When remote push is built, this returns the Expo push token to hand to
   * a PARENT-scoped backend endpoint. See README "Remote push (deferred)".
   */
  getPushToken(): Promise<string | null>;
}
