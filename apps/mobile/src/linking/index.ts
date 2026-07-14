// apps/mobile/src/linking/index.ts
//
// The linking factory (issue #65): use the real React Native `Linking` provider
// when the module resolves, otherwise the in-memory mock so the app always runs.
// Callers depend only on the LinkingProvider interface. Mirrors the billing and
// notifications factories.
import { loadRNLinking } from "./rnLinking";
import { RNLinkingProvider } from "./rnProvider";
import { MockLinkingProvider } from "./mockProvider";
import type { LinkingProvider } from "./types";

export type { LinkingProvider } from "./types";

export function createLinkingProvider(): LinkingProvider {
  const mod = loadRNLinking();
  if (mod) return new RNLinkingProvider(mod);
  return new MockLinkingProvider();
}
