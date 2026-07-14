// apps/mobile/src/connectivity/context.tsx
//
// The connectivity context (issue #66): the one place the app's online/offline
// state lives, so any screen can read the same truth with useConnectivity(). It
// owns a ConnectivityProvider, reads the initial state on mount, and subscribes to
// changes. This is the "shared hook/service for online/offline state" (requirement 1).
//
// State is in-memory for the session, matching the rest of this UI port. The
// EXPO_PUBLIC_FORCE_OFFLINE override lets QA simulate offline on top of ANY provider
// (Expo Go included), so the offline UX is verifiable without airplane mode.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isDefinitelyOffline, type Connectivity } from "@bedtime-quests/core/offline";
import { createConnectivityProvider, type ConnectivityProvider } from "./index";

/** Forced-offline override for simulation/QA. Set EXPO_PUBLIC_FORCE_OFFLINE=1. */
function forcedOffline(): boolean {
  return process.env.EXPO_PUBLIC_FORCE_OFFLINE === "1";
}

type ConnectivityApi = {
  /** True once the initial state has been read. */
  ready: boolean;
  /** Which provider is active ("netinfo" on device with the module, else "mock"). */
  providerName: ConnectivityProvider["name"];
  /** The current coarse connectivity. */
  connectivity: Connectivity;
  /** Convenience: true only when we positively know we are offline. */
  isOffline: boolean;
};

const Ctx = createContext<ConnectivityApi | null>(null);

export function ConnectivityProviderScope({ children }: { children: ReactNode }) {
  const provider = useMemo<ConnectivityProvider>(() => createConnectivityProvider(), []);
  const forced = forcedOffline();
  const [ready, setReady] = useState(false);
  const [connectivity, setConnectivity] = useState<Connectivity>(forced ? "offline" : "unknown");

  useEffect(() => {
    // When forced offline for QA, do not read or subscribe: hold "offline" steadily.
    if (forced) {
      setReady(true);
      return;
    }
    let alive = true;
    provider
      .getState()
      .then((state) => {
        if (alive) {
          setConnectivity(state);
          setReady(true);
        }
      })
      .catch(() => {
        if (alive) setReady(true); // never block the app on a connectivity read
      });
    const unsubscribe = provider.subscribe((state) => {
      if (alive) setConnectivity(state);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [provider, forced]);

  const value = useMemo<ConnectivityApi>(
    () => ({
      ready,
      providerName: provider.name,
      connectivity,
      isOffline: isDefinitelyOffline(connectivity),
    }),
    [ready, provider.name, connectivity],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConnectivity(): ConnectivityApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConnectivity must be used inside <ConnectivityProviderScope>");
  return v;
}
