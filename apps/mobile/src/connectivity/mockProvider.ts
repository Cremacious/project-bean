// apps/mobile/src/connectivity/mockProvider.ts
//
// The in-memory connectivity provider (issue #66). It runs whenever NetInfo is not
// available (Expo Go, CI, this repo, or a dev build before the prepare step), so the
// app always has a connectivity signal. It reports "online" by default so nothing is
// hidden when we simply cannot measure the network.
//
// QA / simulation: the context (context.tsx) applies the EXPO_PUBLIC_FORCE_OFFLINE
// override on top of ANY provider, so the offline states are exercisable in Expo Go
// without a native module and without toggling airplane mode. The mock therefore
// stays deliberately simple: a steady "online" that never changes.
import type { Connectivity, ConnectivityProvider } from "./types";

export class MockConnectivityProvider implements ConnectivityProvider {
  readonly name = "mock" as const;

  async getState(): Promise<Connectivity> {
    return "online";
  }

  subscribe(_listener: (state: Connectivity) => void): () => void {
    // The mock's state never changes, so there is nothing to emit; unsubscribe is a
    // no-op. Simulated offline is driven by EXPO_PUBLIC_FORCE_OFFLINE in the context.
    return () => {};
  }
}
