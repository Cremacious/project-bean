"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { friendlyAuthError } from "@/lib/auth-errors";

/**
 * "Sign out of all other devices" control (issue #22). Calls
 * revokeOtherSessions, which deletes every session for this parent except the
 * one on this device, so a lost or shared phone loses access right away while
 * the parent stays signed in here.
 */
export function SessionsForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const { error: apiError } = await authClient.revokeOtherSessions();
      if (apiError) {
        setError(
          friendlyAuthError(apiError, "We could not sign out your other devices. Please try again in a moment."),
        );
        return;
      }
      setDone(true);
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
        {isPending ? "Signing out…" : "Sign out of all other devices"}
      </button>

      {error && (
        <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm font-semibold text-[var(--pc-plum-ink)]">
          Your other devices are signed out. You are still signed in here.
        </p>
      )}
    </div>
  );
}
