// apps/mobile/src/notifications/index.ts
//
// The notifications factory (issue #56): use the real expo-notifications provider
// when the native module is present, otherwise fall back to the in-memory mock so
// the app always runs (Expo Go without the module, CI, this repo). Callers depend
// only on the NotificationsProvider interface, so they never branch on which one
// they got. This mirrors the billing factory (src/billing/index.ts).
import { loadNotifications } from "./nativeNotifications";
import { ExpoNotificationsProvider } from "./expoProvider";
import { MockNotificationsProvider } from "./mockProvider";
import type { NotificationsProvider } from "./types";

export type { NotificationsProvider, PermissionStatus } from "./types";

/**
 * Build the notifications provider for this runtime. The real Expo provider only
 * when expo-notifications loaded; every other case uses the mock.
 */
export function createNotificationsProvider(): NotificationsProvider {
  const mod = loadNotifications();
  if (mod) return new ExpoNotificationsProvider(mod);
  return new MockNotificationsProvider();
}
