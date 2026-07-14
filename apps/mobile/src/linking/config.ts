// apps/mobile/src/linking/config.ts
//
// Linking configuration for the native app (issue #65). Nothing secret lives here
// and `.env.local` is never read: these are public routing values only.

/**
 * An OPTIONAL simulated cold-start URL, read from Expo public env. When set (e.g.
 * `EXPO_PUBLIC_LINK_INITIAL_URL=bedtimequests://story/starlight-sail`), the app
 * behaves as if it were launched by tapping that link, so the whole cold-start
 * routing path can be exercised in a simulator or Expo Go WITHOUT a real tap. A
 * real launch URL always takes precedence over this (see rnProvider). Mirrors the
 * billing/notifications mock env overrides. Leave it unset in real builds.
 */
export function simulatedInitialUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_LINK_INITIAL_URL;
  return url && url.length > 0 ? url : null;
}
