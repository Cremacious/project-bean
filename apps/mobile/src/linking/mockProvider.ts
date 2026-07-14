// apps/mobile/src/linking/mockProvider.ts
//
// The in-memory LinkingProvider (issue #65). It runs when React Native's `Linking`
// cannot be resolved, so the app always constructs a provider. It surfaces the
// optional simulated cold-start URL (EXPO_PUBLIC_LINK_INITIAL_URL) and delivers no
// runtime links, matching the shape of the notifications/billing mocks.
import { simulatedInitialUrl } from "./config";
import type { LinkingProvider } from "./types";

export class MockLinkingProvider implements LinkingProvider {
  readonly name = "mock" as const;

  async getInitialURL(): Promise<string | null> {
    return simulatedInitialUrl();
  }

  addUrlListener(): () => void {
    // No OS links are delivered to the mock, so nothing ever fires.
    return () => {};
  }
}
