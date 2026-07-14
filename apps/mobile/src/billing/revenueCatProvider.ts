// apps/mobile/src/billing/revenueCatProvider.ts
//
// The real RevenueCat BillingProvider (issue #55). It drives react-native-purchases
// through the narrow surface in nativePurchases.ts and maps every result back into
// the shared core Subscription with subscriptionFromRevenueCat, so native gating is
// the exact same #33 rule the web uses. It is only constructed when the SDK is
// present AND a public key is configured (see index.ts); otherwise the mock runs.
//
// COPPA (docs/COMPLIANCE-COPPA.md section 6c): the appUserID passed to configure /
// logIn is the PARENT account id only. No child name, id, or attribute is ever sent
// to RevenueCat.
import {
  PLAN_LIST,
  PREMIUM_ENTITLEMENT_ID,
  type PlanKey,
} from "@bedtime-quests/core/plans";
import {
  subscriptionFromRevenueCat,
  type Subscription,
} from "@bedtime-quests/core";
import type {
  RCCustomerInfo,
  RCErrorCodes,
  RCLogLevels,
  RCPackage,
  RCPurchaseError,
  RCPurchases,
} from "./nativePurchases";
import type { BillingProvider, OfferedPlan, PurchaseOutcome, RestoreOutcome } from "./types";

/** Read the active "premium" entitlement off CustomerInfo and map it to core. */
function subscriptionFromInfo(info: RCCustomerInfo): Subscription {
  const ent = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!ent) return subscriptionFromRevenueCat(null);
  return subscriptionFromRevenueCat({
    isActive: ent.isActive,
    willRenew: ent.willRenew,
    periodType: ent.periodType,
    productIdentifier: ent.productIdentifier ?? null,
    expirationDateMs: ent.expirationDate ? Date.parse(ent.expirationDate) : null,
    billingIssueDetected: ent.billingIssueDetectedAt != null,
  });
}

export class RevenueCatProvider implements BillingProvider {
  readonly name = "revenuecat" as const;

  private readonly purchases: RCPurchases;
  private readonly apiKey: string;
  private readonly logLevels?: RCLogLevels;
  private readonly errorCodes?: RCErrorCodes;
  private configured = false;
  // Cached store packages by plan, populated by getOfferings and reused by purchase.
  private packagesByPlan: Partial<Record<PlanKey, RCPackage>> = {};

  constructor(
    purchases: RCPurchases,
    apiKey: string,
    logLevels?: RCLogLevels,
    errorCodes?: RCErrorCodes,
  ) {
    this.purchases = purchases;
    this.apiKey = apiKey;
    this.logLevels = logLevels;
    this.errorCodes = errorCodes;
  }

  async configure(appUserId: string | null): Promise<void> {
    if (this.configured) return;
    if (this.logLevels?.INFO !== undefined) {
      this.purchases.setLogLevel(this.logLevels.INFO);
    }
    // appUserID omitted -> RevenueCat starts anonymous; logIn attaches the parent.
    this.purchases.configure({ apiKey: this.apiKey, appUserID: appUserId ?? undefined });
    this.configured = true;
  }

  async logIn(appUserId: string): Promise<Subscription> {
    const { customerInfo } = await this.purchases.logIn(appUserId);
    return subscriptionFromInfo(customerInfo);
  }

  async logOut(): Promise<void> {
    try {
      await this.purchases.logOut();
    } catch {
      // Logging out an already-anonymous user throws; that is a no-op for us.
    }
  }

  async getOfferings(): Promise<OfferedPlan[]> {
    const offerings = await this.purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    this.packagesByPlan = {};

    const plans: OfferedPlan[] = [];
    // Preserve core display order (monthly, then yearly) and only surface plans
    // that actually have a matching store package in the current offering.
    for (const plan of PLAN_LIST) {
      const pkg = packages.find((p) => p.product.identifier === plan.productId);
      if (!pkg) continue;
      this.packagesByPlan[plan.key] = pkg;
      plans.push({
        key: plan.key,
        name: plan.name,
        priceString: pkg.product.priceString,
        period: plan.period,
        productId: plan.productId,
        highlight: plan.highlight,
      });
    }
    return plans;
  }

  async getEntitlement(): Promise<Subscription> {
    const info = await this.purchases.getCustomerInfo();
    return subscriptionFromInfo(info);
  }

  async purchase(planKey: PlanKey): Promise<PurchaseOutcome> {
    let pkg = this.packagesByPlan[planKey];
    if (!pkg) {
      // Offerings may not have been fetched yet (e.g. a retry); fetch once more.
      await this.getOfferings();
      pkg = this.packagesByPlan[planKey];
    }
    if (!pkg) {
      return { kind: "error", message: "That plan is not available right now." };
    }
    try {
      const { customerInfo } = await this.purchases.purchasePackage(pkg);
      return { kind: "success", subscription: subscriptionFromInfo(customerInfo) };
    } catch (e) {
      const err = e as RCPurchaseError;
      if (err.userCancelled) return { kind: "cancelled" };
      if (this.errorCodes?.PAYMENT_PENDING_ERROR && err.code === this.errorCodes.PAYMENT_PENDING_ERROR) {
        return { kind: "pending" };
      }
      return { kind: "error", message: "The purchase could not be completed." };
    }
  }

  async restore(): Promise<RestoreOutcome> {
    try {
      const info = await this.purchases.restorePurchases();
      const subscription = subscriptionFromInfo(info);
      return subscription.isActive ? { kind: "restored", subscription } : { kind: "none" };
    } catch {
      return { kind: "error", message: "We could not check your purchases just now." };
    }
  }
}
