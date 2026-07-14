// apps/mobile/src/updates/context.tsx
//
// The OTA updates context (issue #67): the one place the app's update state lives,
// so any screen can read the same truth with useAppUpdates(). It owns an
// UpdatesProvider and runs the update STRATEGY (requirement 2):
//
//   check on cold launch  →  download in the background  →  apply on NEXT cold start
//
// It deliberately NEVER calls reload() on its own: a downloaded update becomes
// pending and the native `expo-updates` launcher swaps it in on the next cold start,
// so a bedtime session is never interrupted mid-read. The only reload path is an
// explicit user tap (`applyNow`) from a calm screen, exposed here for the optional
// <UpdateReadyNotice>.
//
// This context is the SINGLE controller of the check → download flow. app.json sets
// `checkAutomatically: ON_ERROR_RECOVERY` (not ON_LOAD) precisely so the native layer
// does not also auto-download on every launch and race this code; that keeps the
// "update ready" state a single source of truth and avoids a double download. The
// staged update still applies on the next cold start on its own (that is inherent to
// expo-updates), so the silent path works even if no one ever taps the notice.
//
// State is in-memory for the session, matching the rest of this UI port. The
// EXPO_PUBLIC_FORCE_UPDATE_READY override lets QA see the "ready" state on top of ANY
// provider (Expo Go included), so the notice is verifiable without a real OTA build.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createUpdatesProvider, type UpdatesProvider } from "./index";
import { forcedUpdateReady, type UpdateStatus } from "./config";

type UpdatesApi = {
  /** True once the initial launch check has settled (or was skipped). */
  ready: boolean;
  /** Which provider is active ("expo-updates" in a real build, else "mock"). */
  providerName: UpdatesProvider["name"];
  /** The channel this build follows (e.g. "production"), or null. */
  channel: string | null;
  /** The runtime version this build reports, or null. */
  runtimeVersion: string | null;
  /** Where we are in the check → download → ready lifecycle. */
  status: UpdateStatus;
  /** Convenience: an update is downloaded and will apply on the next cold start. */
  isUpdateReady: boolean;
  /**
   * Apply a downloaded update by reloading now. Optional and user-initiated only
   * (the <UpdateReadyNotice> button). Resolves whether or not a reload happened; on
   * the mock or when nothing is pending it is a no-op.
   */
  applyNow(): Promise<void>;
};

const Ctx = createContext<UpdatesApi | null>(null);

export function UpdatesProviderScope({ children }: { children: ReactNode }) {
  const provider = useMemo<UpdatesProvider>(() => createUpdatesProvider(), []);
  const forced = forcedUpdateReady();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>(forced ? "ready" : "unsupported");
  // Guard so an in-flight reload cannot be triggered twice.
  const reloading = useRef(false);

  useEffect(() => {
    // Simulation: hold "ready" steadily and do not touch the provider.
    if (forced) {
      setReady(true);
      return;
    }
    // Nothing to do when OTA is not active for this build (Expo Go, dev client, CI,
    // this repo): stay "unsupported" and mark ready immediately.
    if (!provider.isEnabled) {
      setStatus("unsupported");
      setReady(true);
      return;
    }

    let alive = true;
    (async () => {
      setStatus("checking");
      const { isAvailable } = await provider.checkForUpdate();
      if (!alive) return;
      if (!isAvailable) {
        setStatus("upToDate");
        setReady(true);
        return;
      }
      // Download in the BACKGROUND. The app is already running from its cached bundle
      // (app.json sets fallbackToCacheTimeout: 0), so this never blocks a launch.
      setStatus("downloading");
      const { isNew } = await provider.fetchUpdate();
      if (!alive) return;
      setStatus(isNew ? "ready" : "upToDate");
      setReady(true);
    })().catch(() => {
      // Never let an update check break the app; just settle quietly.
      if (alive) {
        setStatus("upToDate");
        setReady(true);
      }
    });

    return () => {
      alive = false;
    };
  }, [provider, forced]);

  const value = useMemo<UpdatesApi>(
    () => ({
      ready,
      providerName: provider.name,
      channel: provider.channel,
      runtimeVersion: provider.runtimeVersion,
      status,
      isUpdateReady: status === "ready",
      applyNow: async () => {
        if (reloading.current) return;
        reloading.current = true;
        try {
          await provider.reload();
        } finally {
          // If reload() did not actually restart (mock / simulation), clear the guard
          // so a later real tap can still work.
          reloading.current = false;
        }
      },
    }),
    [ready, provider, status],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppUpdates(): UpdatesApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppUpdates must be used inside <UpdatesProviderScope>");
  return v;
}
