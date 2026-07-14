// apps/mobile/src/connectivity/netInfoProvider.ts
//
// The real connectivity provider (issue #66), backed by NetInfo. Active only in a
// dev build where the native module loaded; every other runtime uses the mock. It
// maps NetInfo's rich state down to the app's coarse Connectivity via the pure
// mapper in nativeNetInfo, so the mapping is one place and testable.
import type { Connectivity, ConnectivityProvider } from "./types";
import { connectivityFromNetInfo, type NetInfoModule } from "./nativeNetInfo";

export class NetInfoProvider implements ConnectivityProvider {
  readonly name = "netinfo" as const;

  constructor(private readonly mod: NetInfoModule) {}

  async getState(): Promise<Connectivity> {
    try {
      return connectivityFromNetInfo(await this.mod.fetch());
    } catch {
      // A read hiccup should not be treated as offline (that would wrongly hide
      // online content); report unknown and let the next event settle it.
      return "unknown";
    }
  }

  subscribe(listener: (state: Connectivity) => void): () => void {
    try {
      return this.mod.addEventListener((state) => listener(connectivityFromNetInfo(state)));
    } catch {
      return () => {};
    }
  }
}
