// apps/mobile/src/updates/types.ts
//
// The over-the-air updates provider seam (issue #67). The app depends only on this
// interface, so it never branches on whether the real `expo-updates` native module
// is present or whether OTA is even enabled for this build. A real provider (backed
// by `expo-updates` in a store / preview build) or an in-memory mock (Expo Go, CI,
// this repo, a dev client) both satisfy it, exactly like the billing, notifications,
// linking, and connectivity seams.
//
// The strategy this seam serves (see context.tsx and docs/OTA-UPDATES.md): check for
// an update on cold launch, download it in the background, and let it apply on the
// NEXT cold start. Reading is never interrupted, and the app never reloads itself
// mid-session. `reload()` exists only for an explicit, user-initiated "update now".

/** Result of asking the update server whether a newer update exists. */
export type UpdateCheckResult = {
  /** True when the server has an update this build is eligible to run. */
  isAvailable: boolean;
};

/** Result of downloading the newest update. */
export type UpdateFetchResult = {
  /** True when a new update was downloaded and is now pending for next launch. */
  isNew: boolean;
};

export interface UpdatesProvider {
  /** Which provider is active ("expo-updates" in a real build, else "mock"). */
  readonly name: "expo-updates" | "mock";
  /**
   * Whether OTA is actually live for this build. False in Expo Go, a dev client,
   * this repo, and CI (the module is absent or `Updates.isEnabled` is false), so
   * the context knows there is nothing to check and stays quietly idle.
   */
  readonly isEnabled: boolean;
  /** The EAS Update channel this build follows (e.g. "production"), or null. */
  readonly channel: string | null;
  /** The runtime version this build reports, or null. Gates OTA compatibility. */
  readonly runtimeVersion: string | null;
  /** Ask the server whether a compatible newer update exists. Never throws. */
  checkForUpdate(): Promise<UpdateCheckResult>;
  /** Download the newest update so it is pending for the next launch. Never throws. */
  fetchUpdate(): Promise<UpdateFetchResult>;
  /**
   * Apply the downloaded update by reloading the app. Called ONLY on an explicit
   * user action from a calm screen, never automatically, so a bedtime session is
   * never interrupted mid-story (issue #67 requirement 2).
   */
  reload(): Promise<void>;
}
