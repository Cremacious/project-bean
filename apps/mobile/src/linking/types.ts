// apps/mobile/src/linking/types.ts
//
// The linking seam (issue #65). The linking context is written against this
// LinkingProvider interface, satisfied at runtime by either the real React Native
// `Linking` module (the standard on device) or an in-memory mock (so the flow is
// exercisable in any environment, and a cold-start link can be simulated without a
// device). This mirrors the billing and notifications seams: callers depend only
// on the interface, never on which implementation they got.
//
// Scope: this only READS incoming deep/universal/app link URLs and hands them to
// the pure `parseDeepLink` mapper in `@bedtime-quests/core`; the native config
// (custom scheme, associated domains, Android intent filters in app.json) is what
// makes the OS deliver those URLs here in the first place.

export interface LinkingProvider {
  /** Which implementation this is, for logs. */
  readonly name: "react-native" | "mock";

  /**
   * The URL the app was COLD-STARTED from (a tapped link that launched the app),
   * or null if it started normally. Resolved once on mount.
   */
  getInitialURL(): Promise<string | null>;

  /**
   * Subscribe to links that arrive while the app is already running (foreground or
   * background -> foreground). Returns an unsubscribe function.
   */
  addUrlListener(onUrl: (url: string) => void): () => void;
}
