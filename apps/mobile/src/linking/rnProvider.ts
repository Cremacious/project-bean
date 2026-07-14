// apps/mobile/src/linking/rnProvider.ts
//
// The real LinkingProvider backed by React Native's `Linking` (issue #65). It only
// reads incoming URLs; routing them into screens is done by the context via the
// pure `parseDeepLink` mapper. It is only constructed when `Linking` actually
// loaded (see index.ts), so it never has to guard for a missing module.
import { simulatedInitialUrl } from "./config";
import type { RNLinkingModule } from "./rnLinking";
import type { LinkingProvider } from "./types";

export class RNLinkingProvider implements LinkingProvider {
  readonly name = "react-native" as const;

  private readonly L: RNLinkingModule;

  constructor(mod: RNLinkingModule) {
    this.L = mod;
  }

  async getInitialURL(): Promise<string | null> {
    // A REAL launch URL always wins; the env override is only a fallback so a
    // cold-start link can be simulated locally when there is no real one.
    const real = await this.L.getInitialURL();
    return real ?? simulatedInitialUrl();
  }

  addUrlListener(onUrl: (url: string) => void): () => void {
    const sub = this.L.addEventListener("url", ({ url }) => onUrl(url));
    return () => sub.remove();
  }
}
