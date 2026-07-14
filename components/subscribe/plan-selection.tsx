"use client";

// components/subscribe/plan-selection.tsx
// The subscription plan picker (issue #35). A parent chooses monthly or yearly,
// then starts their free trial. The subscribe action passes through the parental
// gate (#32) before any payment step, then calls the server seam
// (lib/subscribe-actions). Because purchasing is deferred to the native app
// (issue #33 option c, milestone M6), a successful action explains that the free
// trial starts in the app rather than faking a purchase on the web (#55 completes
// the real checkout). Copy is dash free (UI rule 1) and every control looks
// clickable with a pointer cursor (UI rule 2).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useParentalGate } from "@/components/parental-gate/parental-gate-provider";
import { startSubscription } from "@/lib/subscribe-actions";
import { track } from "@/lib/analytics";
import {
  PLAN_LIST,
  TRIAL_DAYS,
  formatUsd,
  yearlySavings,
  type Plan,
  type PlanKey,
} from "@bedtime-quests/core/plans";

type FlowState =
  | { step: "choosing" }
  | { step: "cancelled" } // grown up backed out of the gate
  | { step: "deferred" } // purchase happens in the native app
  | { step: "error"; message: string };

const savings = yearlySavings();

/** The per plan pricing lines shown on each card. All copy is dash free. */
function planPricing(plan: Plan): { headline: string; sub: string } {
  if (plan.period === "year") {
    return {
      headline: `${formatUsd(plan.priceCents)} a year`,
      sub: `Just ${formatUsd(savings.monthlyEquivalentCents)} a month, ${plan.cadence}`,
    };
  }
  return {
    headline: `${formatUsd(plan.priceCents)} a month`,
    sub: plan.cadence,
  };
}

export function PlanSelection() {
  const requireAdult = useParentalGate();
  const router = useRouter();
  const [selected, setSelected] = useState<PlanKey>("yearly");
  const [flow, setFlow] = useState<FlowState>({ step: "choosing" });
  const [pending, startTransition] = useTransition();

  async function onSubscribe() {
    setFlow({ step: "choosing" });
    // A grown up confirms before any payment step (#32).
    const ok = await requireAdult("purchase");
    if (!ok) {
      setFlow({ step: "cancelled" });
      return;
    }
    // Non-personal: the parent committed to a plan and passed the grown-up gate.
    // Only the plan type is sent (the real trial/purchase completes in the native
    // app via the RevenueCat webhook, M6 #55).
    track("subscribe_started", { from: "plans", plan: selected });
    startTransition(async () => {
      try {
        const result = await startSubscription(selected);
        if (result.ok) {
          // Web hands off to the native app; we never fake a success here.
          setFlow({ step: "deferred" });
          return;
        }
        if (result.reason === "already_subscribed") {
          router.push("/");
          return;
        }
        if (result.reason === "unauthenticated") {
          router.push("/sign-in");
          return;
        }
        setFlow({
          step: "error",
          message: "We could not start that plan. Please try again.",
        });
      } catch {
        setFlow({
          step: "error",
          message: "Something went wrong on our end. Please try again in a moment.",
        });
      }
    });
  }

  if (flow.step === "deferred") {
    return <DeferredToApp onBack={() => setFlow({ step: "choosing" })} />;
  }

  const selectedPlan = PLAN_LIST.find((p) => p.key === selected)!;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 py-4">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Choose your plan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base font-medium text-[var(--pc-ink)]">
          Every plan starts with a {TRIAL_DAYS} day free trial. Read the whole library free, and only keep
          going if your family loves it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Subscription plans">
        {PLAN_LIST.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={selected === plan.key}
            onSelect={() => setSelected(plan.key)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onSubscribe}
          disabled={pending}
          className="flex min-h-[52px] w-full max-w-sm cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-[var(--pc-poppy)] px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-poppy-ink)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "One moment…" : `Start your ${TRIAL_DAYS} day free trial`}
        </button>

        <p className="text-center text-sm font-semibold text-[var(--pc-ink)]">
          {TRIAL_DAYS} day free trial, then {formatUsd(selectedPlan.priceCents)} a {selectedPlan.period}. Your
          subscription renews automatically until you cancel, and you can cancel anytime.
        </p>

        {flow.step === "cancelled" && (
          <p
            role="status"
            className="max-w-sm rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sun)] px-4 py-3 text-center text-sm font-bold text-[var(--pc-sun-ink)]"
          >
            No worries. Start your free trial whenever a grown up is ready.
          </p>
        )}

        {flow.step === "error" && (
          <p
            role="alert"
            className="max-w-sm rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-white px-4 py-3 text-center text-sm font-bold text-[var(--pc-ink)]"
          >
            {flow.message}
          </p>
        )}
      </div>

      <Link
        href="/"
        className="mx-auto inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 py-2 text-sm font-bold text-[var(--pc-plum-ink)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        Back to the free stories
      </Link>
    </section>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const pricing = planPricing(plan);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex cursor-pointer flex-col gap-2 rounded-3xl border-2 bg-white p-5 text-left shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
      style={{
        borderColor: selected ? "var(--pc-plum)" : "var(--pc-line)",
        boxShadow: selected ? "0 5px 0 var(--pc-plum)" : "0 5px 0 var(--pc-line)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold text-[var(--pc-ink)]">{plan.name}</h2>
        {plan.highlight && (
          <span className="rounded-full bg-[var(--pc-leaf)] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-leaf-ink)]">
            Save {savings.savingsPercent}%
          </span>
        )}
      </div>

      <p className="font-display text-2xl font-extrabold text-[var(--pc-ink)]">{pricing.headline}</p>
      <p className="text-sm font-semibold text-[var(--pc-ink)]">{pricing.sub}</p>

      <div className="mt-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full border-2 text-[11px] font-black text-white"
          style={{
            borderColor: selected ? "var(--pc-plum)" : "var(--pc-line)",
            background: selected ? "var(--pc-plum)" : "transparent",
          }}
        >
          {selected ? "✓" : ""}
        </span>
        <span className="text-sm font-bold text-[var(--pc-ink)]">
          {selected ? "Selected" : "Choose this plan"}
        </span>
      </div>
    </button>
  );
}

// The honest "purchase happens in the app" handoff shown on a successful start
// (issue #33 option c). No entitlement is granted here; the native app (#55) runs
// the real checkout and the webhook reports the trial or purchase back to us.
function DeferredToApp({ onBack }: { onBack: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-8 text-center">
      <div className="w-full rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)] sm:p-8">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        >
          📱
        </div>

        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-3xl">
          Your free trial starts in the app
        </h1>

        <p className="mt-3 text-base font-medium text-[var(--pc-ink)]">
          Bedtime Quests subscriptions are handled safely inside our app, coming soon to iPhone and Android.
          When it arrives you can start your {TRIAL_DAYS} day free trial there, and every story unlocks on this
          account right away.
        </p>

        <p className="mt-4 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] px-4 py-3 text-sm font-bold text-[var(--pc-ink)]">
          Nothing was charged. Your free stories are always here in the meantime.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-[var(--pc-plum)] bg-white px-5 py-3 text-base font-bold text-[var(--pc-plum-ink)] shadow-[0_5px_0_var(--pc-plum)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
        >
          Back to the plans
        </button>
      </div>

      <Link
        href="/"
        className="mt-5 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 py-2 text-sm font-bold text-[var(--pc-plum-ink)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        Back to the free stories
      </Link>
    </section>
  );
}
