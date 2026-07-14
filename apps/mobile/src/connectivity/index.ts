// apps/mobile/src/connectivity/index.ts
//
// The connectivity factory (issue #66): use the real NetInfo provider when the
// native module is present, otherwise fall back to the in-memory mock so the app
// always runs (Expo Go without the module, CI, this repo). Callers depend only on
// the ConnectivityProvider interface. Mirrors the billing / notifications factories.
import { loadNetInfo } from "./nativeNetInfo";
import { NetInfoProvider } from "./netInfoProvider";
import { MockConnectivityProvider } from "./mockProvider";
import type { ConnectivityProvider } from "./types";

export type { ConnectivityProvider, Connectivity } from "./types";

/**
 * Build the connectivity provider for this runtime. The real NetInfo provider only
 * when the module loaded; every other case uses the mock.
 */
export function createConnectivityProvider(): ConnectivityProvider {
  const mod = loadNetInfo();
  if (mod) return new NetInfoProvider(mod);
  return new MockConnectivityProvider();
}
