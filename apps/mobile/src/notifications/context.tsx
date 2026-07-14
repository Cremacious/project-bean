// apps/mobile/src/notifications/context.tsx
//
// The reminders context (issue #56): the one place the bedtime reminder's state
// and actions live, so the settings screen and the navigator both read the same
// truth. It owns the NotificationsProvider, the parent's chosen settings, and the
// current OS permission, and it enforces the consent flow:
//   - Reminders are OFF until the parent explicitly turns them on (COPPA: default
//     off; docs/COMPLIANCE-COPPA.md section 3).
//   - The OS permission is requested ONLY inside enableReminder(), i.e. after the
//     settings screen has shown parent-facing context (issue #56 requirement 1).
//   - A decline is respected: we surface "denied" and never re-prompt in a loop;
//     the screen offers a path to the OS settings instead (requirement 5).
//
// State is in-memory for the session, matching the rest of this UI port (the store
// is in-memory too). The actual schedule lives on the device via the OS, so on
// mount we reconcile "enabled" from whether a reminder is already scheduled.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_REMINDER_SETTINGS,
  type ReminderSettings,
  type ReminderTime,
} from "@bedtime-quests/core/notifications";
import { createNotificationsProvider, type NotificationsProvider, type PermissionStatus } from "./index";

/** The result of trying to turn the reminder on, so the UI can react precisely. */
export type EnableResult = { ok: boolean; permission: PermissionStatus };

type RemindersApi = {
  /** True once the provider has been prepared and the initial state read. */
  ready: boolean;
  /** Which provider is active ("expo" on device with the module, else "mock"). */
  providerName: NotificationsProvider["name"];
  /** The current OS permission for notifications. */
  permission: PermissionStatus;
  /** The parent's reminder settings (enabled + time). */
  settings: ReminderSettings;

  /**
   * Turn the reminder on. Requests OS permission if needed (the parent has already
   * seen the in-app explanation by this point), then schedules the daily reminder.
   * Returns whether it is now on and the resolved permission.
   */
  enableReminder: () => Promise<EnableResult>;
  /** Turn the reminder off and cancel the schedule. */
  disableReminder: () => Promise<void>;
  /** Change the time; reschedules immediately when the reminder is on. */
  setReminderTime: (time: ReminderTime) => Promise<void>;
  /** Re-read the OS permission (e.g. after the parent returns from OS settings). */
  refreshPermission: () => Promise<void>;
  /** Subscribe to reminder taps (the navigator uses this to deep-link). */
  addTapListener: (onTap: () => void) => () => void;
};

const Ctx = createContext<RemindersApi | null>(null);

export function NotificationsProviderScope({ children }: { children: ReactNode }) {
  const provider = useMemo<NotificationsProvider>(() => createNotificationsProvider(), []);
  const [ready, setReady] = useState(false);
  const [permission, setPermission] = useState<PermissionStatus>("undetermined");
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);

  // On mount: prepare the provider, read the permission WITHOUT prompting, and
  // reconcile "enabled" from whether a reminder is already scheduled on the device.
  useEffect(() => {
    let alive = true;
    (async () => {
      await provider.prepare();
      const perm = await provider.getPermissionStatus();
      const scheduled = await provider.isReminderScheduled();
      if (!alive) return;
      setPermission(perm);
      setSettings((s) => ({ ...s, enabled: scheduled && perm === "granted" }));
      setReady(true);
    })().catch(() => {
      if (alive) setReady(true); // never block the app on a notifications hiccup
    });
    return () => {
      alive = false;
    };
  }, [provider]);

  const enableReminder = useCallback(async (): Promise<EnableResult> => {
    let perm = await provider.getPermissionStatus();
    if (perm !== "granted") perm = await provider.requestPermission();
    setPermission(perm);
    if (perm !== "granted") {
      setSettings((s) => ({ ...s, enabled: false }));
      return { ok: false, permission: perm };
    }
    const ok = await provider.scheduleDailyReminder(settings.time);
    setSettings((s) => ({ ...s, enabled: ok }));
    return { ok, permission: perm };
  }, [provider, settings.time]);

  const disableReminder = useCallback(async () => {
    await provider.cancelReminder();
    setSettings((s) => ({ ...s, enabled: false }));
  }, [provider]);

  const setReminderTime = useCallback(
    async (time: ReminderTime) => {
      setSettings((s) => ({ ...s, time }));
      // If the reminder is already on, move it to the new time right away.
      if (settings.enabled && permission === "granted") {
        await provider.scheduleDailyReminder(time);
      }
    },
    [provider, settings.enabled, permission],
  );

  const refreshPermission = useCallback(async () => {
    const perm = await provider.getPermissionStatus();
    setPermission(perm);
    // If permission was revoked in OS settings, the schedule cannot fire: reflect off.
    if (perm !== "granted") setSettings((s) => ({ ...s, enabled: false }));
  }, [provider]);

  const addTapListener = useCallback((onTap: () => void) => provider.addResponseListener(onTap), [provider]);

  const value: RemindersApi = {
    ready,
    providerName: provider.name,
    permission,
    settings,
    enableReminder,
    disableReminder,
    setReminderTime,
    refreshPermission,
    addTapListener,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReminders(): RemindersApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReminders must be used inside <NotificationsProviderScope>");
  return v;
}
