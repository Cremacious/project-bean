// apps/mobile/src/billing/nativePurchases.ts
//
// The runtime loader and a narrow typed surface for `react-native-purchases`
// (issue #55). The native module only exists in a DEV BUILD (it is native code:
// StoreKit on iOS, Google Play Billing on Android), so it is absent in Expo Go, in
// CI, and in this repo until `npx expo install react-native-purchases` plus a dev
// build. We therefore `require` it lazily and catch a missing module, instead of a
// static `import` that would fail to resolve at bundle or typecheck time. The
// factory (index.ts) falls back to the mock provider whenever this returns null.
//
// We type only the slice of the SDK we call, so the whole file typechecks with the
// package uninstalled and does not fight the package's own bundled types once it is.

/** The active "premium" entitlement slice we read off CustomerInfo. */
export type RCEntitlementInfo = {
  isActive: boolean;
  willRenew: boolean;
  periodType: string; // "NORMAL" | "INTRO" | "TRIAL"
  productIdentifier: string;
  expirationDate: string | null; // ISO date string, null for lifetime
  billingIssueDetectedAt: string | null;
};

export type RCCustomerInfo = {
  entitlements: { active: Record<string, RCEntitlementInfo | undefined> };
};

export type RCStoreProduct = {
  identifier: string; // the store product id, e.g. bedtimequests_premium_monthly
  priceString: string; // localized, e.g. "$4.99"
};

export type RCPackage = {
  identifier: string; // RevenueCat package id, e.g. "$rc_monthly"
  product: RCStoreProduct;
};

export type RCOffering = { availablePackages: RCPackage[] };
export type RCOfferings = { current: RCOffering | null };

/** The Purchases singleton (the module's default export) surface we use. */
export type RCPurchases = {
  configure(opts: { apiKey: string; appUserID?: string | null }): void;
  setLogLevel(level: unknown): void;
  logIn(appUserID: string): Promise<{ customerInfo: RCCustomerInfo; created: boolean }>;
  logOut(): Promise<RCCustomerInfo>;
  getOfferings(): Promise<RCOfferings>;
  getCustomerInfo(): Promise<RCCustomerInfo>;
  purchasePackage(pkg: RCPackage): Promise<{ customerInfo: RCCustomerInfo }>;
  restorePurchases(): Promise<RCCustomerInfo>;
};

/** Error-code constants we branch on when a purchase rejects. */
export type RCErrorCodes = {
  PURCHASE_CANCELLED_ERROR?: string;
  PAYMENT_PENDING_ERROR?: string;
};

/** Log levels; only VERBOSE/INFO used. Optional because the mock never reads it. */
export type RCLogLevels = { VERBOSE?: unknown; INFO?: unknown; ERROR?: unknown };

export type RCModule = {
  default: RCPurchases;
  LOG_LEVEL?: RCLogLevels;
  PURCHASES_ERROR_CODE?: RCErrorCodes;
};

let loaded: RCModule | null | undefined;

/**
 * Load `react-native-purchases`, or null when it is not installed / not in a dev
 * build. Cached so the require is attempted once. Never throws.
 */
export function loadPurchases(): RCModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // The optional native module is loaded at runtime (dev build only), so a
    // require here is deliberate; a static import would fail to resolve.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("react-native-purchases") as RCModule;
  } catch {
    loaded = null;
  }
  return loaded;
}

/**
 * The shape of a rejected purchase we read to classify the outcome. The SDK sets
 * `userCancelled` on a cancel and `code` from PURCHASES_ERROR_CODE otherwise.
 */
export type RCPurchaseError = {
  userCancelled?: boolean;
  code?: string;
  message?: string;
};
