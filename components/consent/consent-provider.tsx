"use client";

// components/consent/consent-provider.tsx
//
// The client-side home of the shared consent state (issue #50). Mounted once in
// the root layout, it:
//   1. reads the recorded choice from the first-party cookie on mount,
//   2. exposes it (and the actions that change it) through useConsent(), and
//   3. persists every change back to the SAME cookie, so the server render
//      (analytics-scripts.tsx, ad-slot.tsx) sees the exact choice the parent made.
//
// It is the only writer of the consent cookie. Everything else just reads the
// shared state: the banner and the preferences dialog for the UI, analytics and
// ads for whether they may load. When a choice changes we call router.refresh()
// so the server components that gate on the cookie re-render immediately, and we
// actively clean up (clear analytics cookies, tell gtag to deny) when a parent
// turns a category back OFF, so revoking consent takes effect without a reload.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  acceptAll as acceptAllDecision,
  rejectOptional as rejectOptionalDecision,
  makeDecision,
  parseConsentCookie,
  encodeConsent,
  isCategoryGranted,
  hasDecision,
  type ConsentState,
  type OptionalCategory,
} from "@/lib/consent";

type ConsentContextValue = {
  /** The current recorded choice, or null for "no decision yet". */
  state: ConsentState;
  /**
   * True once the cookie has been read on the client. Until then we render no
   * banner and load nothing, which also avoids a hydration mismatch (the server
   * never knows the client cookie at first paint).
   */
  ready: boolean;
  /** True when the banner should be shown (ready and no valid choice recorded). */
  needsDecision: boolean;
  /** Whether the preferences dialog is open. */
  isManagerOpen: boolean;
  /** Turn every optional category ON. */
  acceptAll: () => void;
  /** Turn every optional category OFF (a real, recorded choice). */
  rejectOptional: () => void;
  /** Save a specific set of per-category choices from the preferences dialog. */
  save: (choices: Record<OptionalCategory, boolean>) => void;
  /** Open the preferences dialog (from the banner or the footer link). */
  openManager: () => void;
  /** Close the preferences dialog without changing anything. */
  closeManager: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

/** Read our consent cookie from document.cookie into a validated state. */
function readConsentCookie(): ConsentState {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]+)`),
  );
  return parseConsentCookie(match?.[1]);
}

/** Write the choice back to the first-party cookie (Lax, Secure on https, ~6 months). */
function writeConsentCookie(state: NonNullable<ConsentState>): void {
  const value = encodeURIComponent(encodeConsent(state));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Best-effort removal of Google Analytics' own cookies when a parent withdraws
 * analytics consent. GA sets _ga, _ga_<id>, _gid, _gat*; we expire each on the
 * current path and both the host and dot-host domain so the identifier does not
 * linger. House ads set no cookies, so there is nothing to clear for advertising.
 */
function clearAnalyticsCookies(): void {
  const host = window.location.hostname;
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => /^_ga/.test(n) || n === "_gid" || /^_gat/.test(n));
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${host}`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${host}`;
  }
}

/** If GA has loaded, mirror the analytics choice into its own consent signal. */
function updateGtagConsent(analyticsGranted: boolean): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("consent", "update", {
      analytics_storage: analyticsGranted ? "granted" : "denied",
    });
  } catch {
    // Never let a consent-signal update break the app.
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // state + ready live in one object so the one-time client read is a single
  // setState. `ready` is false until the cookie has been read on the client,
  // which keeps the banner from flashing for a returning parent who already chose.
  const [{ state, ready }, setConsent] = useState<{ state: ConsentState; ready: boolean }>({
    state: null,
    ready: false,
  });
  const [isManagerOpen, setManagerOpen] = useState(false);

  // Read the recorded choice once, after hydration. The server cannot know the
  // client cookie at first paint, so this deliberate one-time client read is the
  // intended pattern (hence the lint opt-out).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent({ state: readConsentCookie(), ready: true });
  }, []);

  const persist = useCallback(
    (next: NonNullable<ConsentState>) => {
      // The previous choice is whatever is currently stored; read it before we
      // overwrite the cookie, so we can tell if analytics was just turned off.
      const previous = readConsentCookie();
      writeConsentCookie(next);
      setConsent({ state: next, ready: true });
      setManagerOpen(false);

      // If analytics was on and is now off, actively clean up its cookies and
      // deny its consent signal so withdrawal takes effect without a reload.
      const wasAnalytics = isCategoryGranted(previous, "analytics");
      if (wasAnalytics && !next.analytics) clearAnalyticsCookies();
      updateGtagConsent(next.analytics);

      // Re-render the server components that gate on the cookie (the ad slot),
      // so the choice is reflected everywhere right away.
      router.refresh();
    },
    [router],
  );

  const acceptAll = useCallback(
    () => persist(acceptAllDecision(new Date().toISOString())),
    [persist],
  );
  const rejectOptional = useCallback(
    () => persist(rejectOptionalDecision(new Date().toISOString())),
    [persist],
  );
  const save = useCallback(
    (choices: Record<OptionalCategory, boolean>) =>
      persist(makeDecision(choices, new Date().toISOString())),
    [persist],
  );
  const openManager = useCallback(() => setManagerOpen(true), []);
  const closeManager = useCallback(() => setManagerOpen(false), []);

  const value: ConsentContextValue = {
    state,
    ready,
    needsDecision: ready && !hasDecision(state),
    isManagerOpen,
    acceptAll,
    rejectOptional,
    save,
    openManager,
    closeManager,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

/** Access the shared consent state and actions. Must be used within ConsentProvider. */
export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}
