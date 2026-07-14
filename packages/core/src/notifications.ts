// packages/core/src/notifications.ts
//
// The platform-agnostic model for the bedtime reminder (issue #56). Everything
// here is pure and framework-free (no React Native, no expo-notifications, no
// I/O), so the reminder time math and the parent-facing copy are decided once and
// unit-tested, then reused by the native app's notification layer.
//
// Compliance posture (docs/COMPLIANCE-COPPA.md):
//  - The reminder is aimed at the PARENT and is a gentle, optional nudge. It is
//    NOT marketing and NOT targeted at a child (section 6). The copy carries no
//    child name, no profile, and no persistent identifier.
//  - The notification itself is a local, on-device schedule (no server, no data
//    leaves the device), which is the data-minimizing default (COPPA section 2).
//  - Copy obeys the app-wide rule: NO dashes in user-facing text (docs/WORKFLOW.md
//    rule 1). `reminderNotificationContent` is unit-tested to guarantee that.

/** A wall-clock time of day in 24-hour form. `hour` 0..23, `minute` 0..59. */
export type ReminderTime = {
  hour: number;
  minute: number;
};

/** The reminder settings a parent controls: whether it is on, and when it fires. */
export type ReminderSettings = {
  /** Off until the parent explicitly opts in (COPPA: default off, section 3). */
  enabled: boolean;
  /** The chosen daily time. */
  time: ReminderTime;
};

/** A gentle default: 7:30 in the evening, a common wind-down time before bed. */
export const DEFAULT_REMINDER_TIME: ReminderTime = { hour: 19, minute: 30 };

/** Reminders are OFF until a parent opts in; this is the safe starting state. */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  time: DEFAULT_REMINDER_TIME,
};

/** The step the time picker moves by, in minutes. */
export const REMINDER_STEP_MINUTES = 15;

const MINUTES_IN_DAY = 24 * 60;

/** Clamp any (possibly out-of-range) time into a valid, whole-minute time of day. */
export function clampReminderTime(time: ReminderTime): ReminderTime {
  const total = Math.round(time.hour) * 60 + Math.round(time.minute);
  const wrapped = ((total % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

/**
 * Move a time forward or back by `deltaMinutes`, wrapping around midnight so the
 * stepper never lands on an invalid time. `+15` at 23:50 becomes 00:05.
 */
export function stepReminderTime(time: ReminderTime, deltaMinutes: number): ReminderTime {
  return clampReminderTime({ hour: time.hour, minute: time.minute + Math.round(deltaMinutes) });
}

/**
 * Format a time for display as a warm, parent-facing 12-hour string with no
 * dashes: "7:30 PM", "9:00 AM", "12:00 AM" (midnight), "12:00 PM" (noon). The
 * minute is always two digits; AM/PM is uppercase.
 */
export function formatReminderTime(time: ReminderTime): string {
  const { hour, minute } = clampReminderTime(time);
  const period = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${minute.toString().padStart(2, "0")} ${period}`;
}

/** The title and body shown in the reminder notification. */
export type NotificationContent = {
  title: string;
  body: string;
};

/**
 * The reminder notification's copy. Deliberately generic and warm, aimed at the
 * parent: it invites a shared bedtime moment and never names or profiles the
 * child, so nothing personal rides in the payload. Contains no dashes, per the
 * app-wide copy rule (asserted in the tests).
 */
export function reminderNotificationContent(): NotificationContent {
  return {
    title: "Storytime is waiting",
    body: "Cozy up for a bedtime story together whenever you are ready.",
  };
}
