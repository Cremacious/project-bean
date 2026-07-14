// apps/mobile/src/notifications/nativeNotifications.ts
//
// The runtime loader and a narrow typed surface for `expo-notifications` (issue
// #56). We keep this module OUT of the workspace lockfile on purpose and load it
// lazily, exactly like `react-native-purchases` in src/billing/nativePurchases.ts:
//  - The repo's Windows lockfile drops the bundled wasm/@emnapi entries, so adding
//    native packages to the root lockfile breaks `npm ci` on Linux CI (see
//    docs/DEPLOYMENT.md and the Windows lockfile note). Loading via `require` and
//    falling back to a mock keeps CI green and the repo installable everywhere.
//  - So this repo, Expo Go without the module, and CI all run the mock; a dev/Go
//    build that ran `npx expo install expo-notifications` gets the real module.
//
// We type only the slice of the SDK we call, so the file typechecks whether or not
// the package is installed.

/** Reduced permission settings we read (unified fields + the iOS detail). */
export type NPermissionSettings = {
  status: string; // "granted" | "denied" | "undetermined"
  granted: boolean;
  canAskAgain: boolean;
  ios?: { status?: number };
};

/** A scheduled request as returned by getAllScheduledNotificationsAsync. */
export type NScheduledRequest = {
  identifier: string;
  content: { data?: Record<string, unknown> | null };
};

/** The remove handle returned by the add*Listener functions. */
export type NSubscription = { remove: () => void };

/** The `expo-notifications` module surface we use (see the SDK 57 docs). */
export type NotificationsModule = {
  getPermissionsAsync(): Promise<NPermissionSettings>;
  requestPermissionsAsync(opts?: {
    ios?: { allowAlert?: boolean; allowBadge?: boolean; allowSound?: boolean };
  }): Promise<NPermissionSettings>;

  scheduleNotificationAsync(request: {
    content: { title: string; body: string; data?: Record<string, unknown> };
    trigger: unknown;
  }): Promise<string>;
  cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  getAllScheduledNotificationsAsync(): Promise<NScheduledRequest[]>;

  setNotificationChannelAsync(channelId: string, channel: Record<string, unknown>): Promise<unknown>;
  setNotificationHandler(handler: unknown | null): void;

  addNotificationResponseReceivedListener(
    listener: (response: { notification: { request: NScheduledRequest } }) => void,
  ): NSubscription;

  getExpoPushTokenAsync(opts: { projectId?: string }): Promise<{ data: string }>;

  /** Enum of schedulable trigger types; we use DAILY. */
  SchedulableTriggerInputTypes: { DAILY: unknown };
  /** Android channel importance levels; we use HIGH. */
  AndroidImportance: Record<string, number>;
};

let loaded: NotificationsModule | null | undefined;

/**
 * Load `expo-notifications`, or null when it is not installed. Cached so the
 * require is attempted once. Never throws.
 */
export function loadNotifications(): NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // The optional module is loaded at runtime (present only once a developer runs
    // `npx expo install expo-notifications`); a static import would fail to resolve
    // in this repo / CI / Expo Go without it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("expo-notifications") as NotificationsModule;
  } catch {
    loaded = null;
  }
  return loaded;
}
