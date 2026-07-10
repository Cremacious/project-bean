// app/(app)/subscribe/page.tsx
// Clean entry point for the subscribe flow. The paywall (#34) routes here after the
// parental gate passes. Plan selection, the free trial, and checkout are wired up in
// #35 (RevenueCat); until then this is an honest, on-brand placeholder. The plan
// panels below are informational only (default cursor, no button affordance) so they
// do not read as clickable per UI rule 2.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getParent } from "@/lib/session";
import { getSubscription } from "@/lib/entitlements";

const PLANS = [
  {
    key: "monthly",
    name: "Monthly",
    price: "billed each month",
    blurb: "A gentle way to start. Cancel anytime.",
  },
  {
    key: "yearly",
    name: "Yearly",
    price: "billed once a year",
    blurb: "Our best value for nightly readers.",
    highlight: true,
  },
];

export default async function SubscribePage() {
  const parent = await getParent();
  if (!parent) redirect("/sign-in");

  // Already subscribed (or on a trial)? There is nothing to buy; send them to read.
  const subscription = await getSubscription(parent);
  if (subscription.isActive) redirect("/");

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 py-4">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          Choose your plan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base font-medium text-[var(--pc-ink)]">
          Every plan starts with a free trial. Read the whole library free for a while, and only keep
          going if your family loves it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="flex flex-col gap-2 rounded-3xl border-2 bg-white p-5"
            style={{ borderColor: plan.highlight ? "var(--pc-plum)" : "var(--pc-line)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-extrabold text-[var(--pc-ink)]">{plan.name}</h2>
              {plan.highlight && (
                <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-plum-ink)]">
                  Best value
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-[var(--pc-sub)]">{plan.price}</p>
            <p className="mt-1 text-sm font-medium text-[var(--pc-ink)]">{plan.blurb}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] p-4 text-center">
        <p className="text-sm font-bold text-[var(--pc-ink)]">
          Checkout is coming soon. We are putting the finishing touches on secure payments and your free
          trial. Thank you for your patience.
        </p>
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
