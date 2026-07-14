// apps/mobile/src/linking/rnLinking.ts
//
// A narrow, typed loader for React Native's built-in `Linking` module (issue #65).
// Unlike expo-notifications / react-native-purchases (optional native modules kept
// out of the lockfile), `Linking` is part of react-native core and is always
// present in the app. We still load it through a guarded accessor so this module
// never throws at import time in a non-RN environment (typecheck, tooling), and so
// the factory can fall back to the mock if it is somehow unavailable, exactly like
// the other seams.
//
// We type only the slice of the API we use.

/** The subscription handle returned by `Linking.addEventListener`. */
export type RNLinkingSubscription = { remove: () => void };

/** The `Linking` surface we use (see the React Native docs). */
export type RNLinkingModule = {
  getInitialURL(): Promise<string | null>;
  addEventListener(
    type: "url",
    handler: (event: { url: string }) => void,
  ): RNLinkingSubscription;
};

let loaded: RNLinkingModule | null | undefined;

/**
 * Return React Native's `Linking`, or null if it cannot be resolved. Cached so the
 * require is attempted once. Never throws.
 */
export function loadRNLinking(): RNLinkingModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require("react-native") as { Linking?: RNLinkingModule };
    loaded = RN.Linking ?? null;
  } catch {
    loaded = null;
  }
  return loaded;
}
