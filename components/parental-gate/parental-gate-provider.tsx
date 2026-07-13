"use client";

// components/parental-gate/parental-gate-provider.tsx
// The reusable entry point for the parental gate (issue #32). Mounted once in the
// root layout so any client component can call:
//
//   const requireAdult = useParentalGate();
//   const ok = await requireAdult("purchase");
//   if (!ok) return;            // grown up backed out
//   startCheckout();            // gated action proceeds
//
// requireAdult(purpose) resolves true once the grown up passes the on screen
// challenge, or false if they back out. A pass is remembered in sessionStorage
// for that purpose, so the same action is not challenged again within the flow;
// it clears when the tab closes. This is the seam the sign up path uses today and
// the paywall/subscription flow (#33 to #36) can wrap without rebuilding it.

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { gatePassKey } from "@bedtime-quests/core/parental-gate";
import { ParentalGateDialog } from "./parental-gate-dialog";

type RequireAdult = (purpose: string) => Promise<boolean>;

const ParentalGateContext = createContext<RequireAdult | null>(null);

type Pending = {
  purpose: string;
  resolve: (passed: boolean) => void;
};

function wasRemembered(purpose: string): boolean {
  try {
    return sessionStorage.getItem(gatePassKey(purpose)) === "1";
  } catch {
    // Storage blocked (private mode, etc.): fail safe by gating every time.
    return false;
  }
}

function remember(purpose: string): void {
  try {
    sessionStorage.setItem(gatePassKey(purpose), "1");
  } catch {
    // If we cannot persist the pass, the only cost is challenging again later.
  }
}

export function ParentalGateProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const requireAdult = useCallback<RequireAdult>((purpose) => {
    if (wasRemembered(purpose)) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      setPending({ purpose, resolve });
    });
  }, []);

  const handlePass = useCallback(() => {
    setPending((current) => {
      if (current) {
        remember(current.purpose);
        current.resolve(true);
      }
      return null;
    });
  }, []);

  const handleCancel = useCallback(() => {
    setPending((current) => {
      current?.resolve(false);
      return null;
    });
  }, []);

  return (
    <ParentalGateContext.Provider value={requireAdult}>
      {children}
      {/* Rendered only while an action waits on the gate; each request mounts a
          fresh dialog, so the challenge always starts new. */}
      {pending && <ParentalGateDialog onPass={handlePass} onCancel={handleCancel} />}
    </ParentalGateContext.Provider>
  );
}

/**
 * Access the parental gate. Returns `requireAdult(purpose)`, which resolves true
 * when a grown up passes the challenge (or has already passed it this session)
 * and false if they back out. Must be used inside a ParentalGateProvider.
 */
export function useParentalGate(): RequireAdult {
  const ctx = useContext(ParentalGateContext);
  if (!ctx) {
    throw new Error("useParentalGate must be used within a ParentalGateProvider");
  }
  return ctx;
}
