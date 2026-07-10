// components/account/subscription-panel.tsx
// The body of the "Subscription" card on the parent account page (issue #36). A
// server component: it turns the parent's Subscription (already read through the
// single #33 abstraction) into plain copy with lib/subscription-display, then shows
//   1. current status (trial with days left, active plan, ending, or not subscribed),
//   2. manage / cancel guidance routed to the billing path chosen in #33 (deferred
//      to the native app store, since the web does not process purchases), and
//   3. a link to the plans for a parent who is not subscribed,
// plus the Restore purchases island (always available, useful across devices).
//
// Copy is dash free (UI rule 1); links/buttons look clickable with a pointer cursor
// (UI rule 2); all text is high contrast (UI rule 3).
import Link from "next/link";
import type { Subscription } from "@/lib/entitlements";
import { describeSubscription, type SubscriptionVariant } from "@/lib/subscription-display";
import { RestorePurchases } from "@/components/account/restore-purchases";

// The status dot color per variant. Dark ink tokens so the dot reads on the light
// status block (UI rule 3).
const DOT: Record<SubscriptionVariant, string> = {
  active: "var(--pc-leaf-ink)",
  trial: "var(--pc-sun-ink)",
  attention: "var(--pc-poppy-ink)",
  none: "var(--pc-plum)",
};

export function SubscriptionPanel({ subscription }: { subscription: Subscription }) {
  const display = describeSubscription(subscription);

  return (
    <div className="space-y-5">
      {/* Current status */}
      <div className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] p-4">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: DOT[display.variant] }}
            aria-hidden="true"
          />
          <h3 className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
            {display.title}
          </h3>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-[var(--pc-ink)]">{display.detail}</p>
        {display.isActive && display.planName && (
          <p className="mt-1 text-sm font-semibold text-[var(--pc-ink)]">
            Plan: {display.planName}
          </p>
        )}
      </div>

      {/* Not subscribed: send them to the plans. */}
      {display.showUpgrade && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--pc-ink)]">
            Want the whole library? Every plan starts with a free trial.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-[var(--pc-poppy)] px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-poppy-ink)] active:translate-y-0.5"
          >
            See plans and pricing
          </Link>
        </div>
      )}

      {/* Manage / cancel: routed to the app store (issue #33 option c). No fake
          cancel button, since the web does not process the purchase. */}
      {display.showManage && (
        <div className="space-y-2 border-t border-[var(--pc-line)] pt-5">
          <h3 className="font-display text-base font-bold text-[var(--pc-ink)]">
            Manage subscription
          </h3>
          <p className="text-sm font-semibold text-[var(--pc-ink)]">
            Your subscription is handled in the app store where you started it. Open the App Store on
            iPhone or Google Play on Android, find Bedtime Quests in your subscriptions, and you can
            change your plan or cancel there. You can cancel anytime in the app store and you keep
            your stories until the time you already paid for runs out.
          </p>
        </div>
      )}

      {/* Restore purchases: always available. */}
      <div className="space-y-2 border-t border-[var(--pc-line)] pt-5">
        <h3 className="font-display text-base font-bold text-[var(--pc-ink)]">Restore purchases</h3>
        <p className="text-sm font-semibold text-[var(--pc-ink)]">
          Already subscribed on another device or with another sign in? Restore your purchase to
          unlock every story on this account.
        </p>
        <RestorePurchases />
      </div>
    </div>
  );
}
