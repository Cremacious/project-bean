// apps/mobile/src/notifications/mockProvider.ts
//
// The in-memory notifications provider (issue #56). It runs whenever
// expo-notifications is not installed (Expo Go without it, CI, this repo), so the
// WHOLE consent + settings flow is exercisable with no native module: the permission
// prompt, enabling / disabling the reminder, changing the time, and the denied-state
// path all work against this simulation. Nothing is ever actually scheduled with the
// OS here; it just tracks state so the UI behaves exactly as it will on device.
//
// To verify the denied-permission UI without a device, set
// EXPO_PUBLIC_NOTIF_MOCK_PERMISSION=denied (default "granted"), mirroring the
// billing mock's EXPO_PUBLIC_BILLING_MOCK_OUTCOME override.
import type { ReminderTime } from "@bedtime-quests/core/notifications";
import type { NotificationsProvider, PermissionStatus } from "./types";

function mockInitialPermission(): PermissionStatus {
  // The parent has not decided yet until they flip the toggle (which "prompts").
  return "undetermined";
}

function mockGrantResult(): PermissionStatus {
  return process.env.EXPO_PUBLIC_NOTIF_MOCK_PERMISSION === "denied" ? "denied" : "granted";
}

export class MockNotificationsProvider implements NotificationsProvider {
  readonly name = "mock" as const;

  private permission: PermissionStatus = mockInitialPermission();
  private scheduledTime: ReminderTime | null = null;

  async prepare(): Promise<void> {
    // Nothing to set up; the mock is ready immediately.
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    return this.permission;
  }

  async requestPermission(): Promise<PermissionStatus> {
    // Simulate the OS prompt: an undetermined parent gets the configured result;
    // an already-decided parent keeps their answer (the OS would not re-prompt).
    if (this.permission === "undetermined") this.permission = mockGrantResult();
    return this.permission;
  }

  async scheduleDailyReminder(time: ReminderTime): Promise<boolean> {
    if (this.permission !== "granted") return false;
    this.scheduledTime = time;
    return true;
  }

  async cancelReminder(): Promise<void> {
    this.scheduledTime = null;
  }

  async isReminderScheduled(): Promise<boolean> {
    return this.scheduledTime !== null;
  }

  addResponseListener(): () => void {
    // No real notifications are delivered by the mock, so nothing can be tapped.
    return () => {};
  }

  async getPushToken(): Promise<string | null> {
    // Remote push is deferred; the mock never returns a token either.
    return null;
  }
}
