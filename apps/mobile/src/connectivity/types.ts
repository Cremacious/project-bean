// apps/mobile/src/connectivity/types.ts
//
// The connectivity provider seam (issue #66). The app depends only on this
// interface, so it never branches on whether the real NetInfo module is present.
// A real provider (backed by @react-native-community/netinfo in a dev build) or an
// in-memory mock (Expo Go, CI, this repo) both satisfy it, exactly like the billing
// and notifications seams.
import type { Connectivity } from "@bedtime-quests/core/offline";

export type { Connectivity };

export interface ConnectivityProvider {
  /** Which provider is active ("netinfo" on a device with the module, else "mock"). */
  readonly name: "netinfo" | "mock";
  /** Read the current connectivity once (used on mount before the first change). */
  getState(): Promise<Connectivity>;
  /**
   * Subscribe to connectivity changes. Calls `listener` on every change and returns
   * an unsubscribe function. The provider does not replay the current state here;
   * the context reads it once via getState() on mount.
   */
  subscribe(listener: (state: Connectivity) => void): () => void;
}
