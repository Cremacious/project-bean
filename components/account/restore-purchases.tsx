"use client";

// components/account/restore-purchases.tsx
// The "Restore purchases" control on the parent account page (issue #36). It calls
// the server seam (lib/restore-actions), which re-reads the parent's entitlement
// through the single #33 abstraction, then reports a clear outcome: restored
// (premium unlocked) or nothing found. On a restore it refreshes the route so the
// status above updates. Copy is dash free (UI rule 1); the button looks clickable
// with a pointer cursor (UI rule 2) and all text is high contrast (UI rule 3).
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restorePurchases } from "@/lib/restore-actions";

type Outcome = "restored" | "none" | "error";

export function RestorePurchases() {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setOutcome(null);
    startTransition(async () => {
      try {
        const result = await restorePurchases();
        if (!result.ok) {
          if (result.reason === "unauthenticated") {
            router.push("/sign-in");
            return;
          }
          setOutcome("error");
          return;
        }
        if (result.restored) {
          setOutcome("restored");
          router.refresh(); // re-render the status card with premium unlocked
        } else {
          setOutcome("none");
        }
      } catch {
        setOutcome("error");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="min-h-[44px] cursor-pointer rounded-2xl border-2 border-[var(--pc-plum-ink)] px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--pc-plum)" }}
      >
        {isPending ? "Checking…" : "Restore purchases"}
      </button>

      {outcome === "restored" && (
        <p
          role="status"
          className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] px-4 py-3 text-sm font-bold text-[var(--pc-ink)]"
        >
          Your purchase is restored. Every story is unlocked on this account.
        </p>
      )}

      {outcome === "none" && (
        <p
          role="status"
          className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-sky)] px-4 py-3 text-sm font-bold text-[var(--pc-ink)]"
        >
          We did not find a subscription for this account. If you subscribed on another device, make
          sure you are signed in with the same account.
        </p>
      )}

      {outcome === "error" && (
        <p
          role="alert"
          className="rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-white px-4 py-3 text-sm font-bold text-[var(--pc-ink)]"
        >
          We could not check your purchases just now. Please try again in a moment.
        </p>
      )}
    </div>
  );
}
