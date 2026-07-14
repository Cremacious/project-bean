// apps/mobile/src/review/config.ts
//
// The store listing URL used for the manual "Rate Bedtime Quests" entry (issue #71
// requirement 3) and as a fallback when the native review prompt is unavailable.
// Nothing secret lives here and `.env.local` is never read. Android is derivable
// from the package id; iOS needs the numeric App Store id, which does not exist
// until the listing is created, so it is read from Expo public env and is simply
// absent until then (the manual entry hides on iOS in that case, while the native
// in-app prompt still works in production).
import { Platform } from "react-native";

/** The Android application id, matching app.json android.package. */
const ANDROID_PACKAGE = "com.bedtimequests.app";

/** The numeric App Store id, once known, via EXPO_PUBLIC_APP_STORE_ID. */
export function appStoreId(): string | null {
  const id = process.env.EXPO_PUBLIC_APP_STORE_ID;
  return id && id.length > 0 ? id : null;
}

/**
 * A best-effort store listing URL for the current platform, or null if unknown.
 * iOS uses the write-a-review deep link when an App Store id is configured; Android
 * links to the Play listing built from the known package id.
 */
export function fallbackStoreUrl(): string | null {
  if (Platform.OS === "android") {
    return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  }
  if (Platform.OS === "ios") {
    const id = appStoreId();
    return id ? `https://apps.apple.com/app/id${id}?action=write-review` : null;
  }
  return null;
}
