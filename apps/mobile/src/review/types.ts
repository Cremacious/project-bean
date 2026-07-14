// apps/mobile/src/review/types.ts
//
// The store-review seam (issue #71). The milestone trigger and the settings entry
// are written against this StoreReviewProvider interface, satisfied at runtime by
// either the real Expo provider (expo-store-review present in a dev/device build)
// or an in-memory mock (Expo Go without it, CI, this repo). Mirrors the billing /
// notifications / cache seams: the UI depends only on the interface, so which
// implementation is used is a factory choice, never a screen rewrite.
//
// The provider deliberately does NOT expose a custom rating UI. requestReview asks
// the OS to present its OWN native prompt (which the OS may choose not to show and
// rate-limits); openStoreListing sends a willing parent to the store's own review
// page. No feature is gated on a review and no incentive is offered.
export interface StoreReviewProvider {
  /** Which implementation this is, for logs and the settings screen note. */
  readonly name: "expo" | "mock";

  /**
   * Whether the OS-native in-app review prompt can be presented on this device
   * right now. False on the web, on iOS TestFlight, and where the module is absent.
   * Never throws.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Ask the OS to present its native review prompt. The OS decides whether to
   * actually show it and rate-limits it; we never learn the outcome. Returns true
   * when the request was issued without error. Never throws.
   */
  requestReview(): Promise<boolean>;

  /**
   * The store listing / write-a-review URL, or null when none is known (e.g. web,
   * or an iOS build with no App Store id configured yet). Backs the manual fallback.
   */
  storeUrl(): string | null;

  /**
   * Open the store listing so a parent can review directly, even when the native
   * prompt is unavailable or already used (issue #71 requirement 3). Returns true
   * when a URL was opened. Never throws.
   */
  openStoreListing(): Promise<boolean>;
}
