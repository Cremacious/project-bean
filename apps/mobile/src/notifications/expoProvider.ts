// apps/mobile/src/notifications/expoProvider.ts
//
// The real expo-notifications NotificationsProvider (issue #56). It schedules a
// single LOCAL, on-device daily reminder for the PARENT and maps the OS permission
// into our three-state PermissionStatus. It never registers a push token, never
// contacts a server, and never puts a child name or profile in a payload
// (docs/COMPLIANCE-COPPA.md sections 2 and 6). Remote push is deferred; getPushToken
// returns null.
//
// It is only constructed when expo-notifications actually loaded (see index.ts);
// otherwise the mock runs, so this file never has to guard for a missing module.
import { Platform } from "react-native";
import { reminderNotificationContent, type ReminderTime } from "@bedtime-quests/core/notifications";
import { REMINDER_CHANNEL_ID, REMINDER_KIND, REMINDER_TAP_SCREEN, easProjectId } from "./config";
import type { NotificationsModule, NScheduledRequest } from "./nativeNotifications";
import type { NotificationsProvider, PermissionStatus } from "./types";

/** Map the SDK permission settings into our three-state status. */
function toStatus(settings: { status: string; granted: boolean }): PermissionStatus {
  if (settings.granted || settings.status === "granted") return "granted";
  if (settings.status === "undetermined") return "undetermined";
  return "denied";
}

/** Is this scheduled request our bedtime reminder (vs anything else)? */
function isOurReminder(req: NScheduledRequest): boolean {
  return req.content?.data?.kind === REMINDER_KIND;
}

export class ExpoNotificationsProvider implements NotificationsProvider {
  readonly name = "expo" as const;

  private readonly N: NotificationsModule;
  private prepared = false;

  constructor(mod: NotificationsModule) {
    this.N = mod;
  }

  async prepare(): Promise<void> {
    if (this.prepared) return;
    // Foreground presentation: show the banner even when the app is open, but never
    // badge or force sound (a bedtime reminder should be gentle).
    this.N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    // Android 8+ requires a channel before anything posts to it.
    if (Platform.OS === "android") {
      await this.N.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: "Bedtime reminders",
        importance: this.N.AndroidImportance.HIGH,
      });
    }
    this.prepared = true;
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    return toStatus(await this.N.getPermissionsAsync());
  }

  async requestPermission(): Promise<PermissionStatus> {
    // We only ask AFTER the parent saw in-app context (issue #56 requirement 1).
    const settings = await this.N.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return toStatus(settings);
  }

  async scheduleDailyReminder(time: ReminderTime): Promise<boolean> {
    await this.prepare();
    if ((await this.getPermissionStatus()) !== "granted") return false;
    // Exactly one reminder: clear any existing one, then schedule the new time.
    await this.cancelReminder();
    const { title, body } = reminderNotificationContent();
    await this.N.scheduleNotificationAsync({
      content: {
        title,
        body,
        // The only data on the payload is a routing marker: no child data, ever.
        data: { kind: REMINDER_KIND, screen: REMINDER_TAP_SCREEN },
      },
      trigger: {
        type: this.N.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        ...(Platform.OS === "android" ? { channelId: REMINDER_CHANNEL_ID } : null),
      },
    });
    return true;
  }

  async cancelReminder(): Promise<void> {
    const scheduled = await this.N.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled.filter(isOurReminder).map((r) => this.N.cancelScheduledNotificationAsync(r.identifier)),
    );
  }

  async isReminderScheduled(): Promise<boolean> {
    const scheduled = await this.N.getAllScheduledNotificationsAsync();
    return scheduled.some(isOurReminder);
  }

  addResponseListener(onTap: () => void): () => void {
    const sub = this.N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content?.data;
      if (data?.kind === REMINDER_KIND) onTap();
    });
    return () => sub.remove();
  }

  async getPushToken(): Promise<string | null> {
    // DEFERRED (issue #56 requirement 2). Remote push is not shipped: there is no
    // parent-scoped backend endpoint to store a token yet (native auth is a stub),
    // so we never register one. The call path is kept so enabling it later is a
    // one-function change, not a rewrite.
    if (!easProjectId()) return null;
    return null;
  }
}
