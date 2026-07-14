// apps/mobile/src/linking/context.tsx
//
// The linking context (issue #65): the one place incoming deep / universal / app
// links are turned into a `DeepLinkTarget` (via the pure core mapper) and handed
// to the navigator. It owns the LinkingProvider and does two things:
//   - resolves the COLD-START link once on mount (the URL that launched the app),
//     exposed as `initialTarget`;
//   - forwards links that arrive WHILE RUNNING (backgrounded -> foregrounded) to
//     subscribers via `addTargetListener`.
// The navigator decides how a target becomes a screen (and honors a cold-start
// link only after the auth/reader gates), so this context stays purely about
// turning URLs into targets. Mirrors the notifications context (#56).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { parseDeepLink, type DeepLinkTarget } from "@bedtime-quests/core/deep-links";
import { createLinkingProvider, type LinkingProvider } from "./index";

type LinkingApi = {
  /** Which provider is active ("react-native" on device, else "mock"). */
  providerName: LinkingProvider["name"];
  /**
   * The target from the link that cold-started the app, or null. Set once the
   * initial URL has been read; the navigator applies it (respecting the gates).
   */
  initialTarget: DeepLinkTarget | null;
  /** Subscribe to targets from links that arrive while the app is running. */
  addTargetListener: (onTarget: (target: DeepLinkTarget) => void) => () => void;
};

const Ctx = createContext<LinkingApi | null>(null);

export function LinkingProviderScope({ children }: { children: ReactNode }) {
  const provider = useMemo<LinkingProvider>(() => createLinkingProvider(), []);
  const [initialTarget, setInitialTarget] = useState<DeepLinkTarget | null>(null);

  // Fan-out to any subscribers (the navigator). A ref-backed Set keeps the
  // subscribe function stable so effects don't re-run and re-subscribe.
  const listeners = useRef(new Set<(t: DeepLinkTarget) => void>());

  // Read the cold-start URL once, and listen for URLs delivered while running.
  useEffect(() => {
    let alive = true;
    provider
      .getInitialURL()
      .then((url) => {
        if (alive && url) setInitialTarget(parseDeepLink(url));
      })
      .catch(() => {
        /* never block the app on a linking hiccup */
      });

    const unsubscribe = provider.addUrlListener((url) => {
      const target = parseDeepLink(url);
      listeners.current.forEach((fn) => fn(target));
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [provider]);

  // Stable across renders (it only touches the ref-backed Set), so the navigator's
  // subscribe effect never needlessly re-runs when initialTarget resolves.
  const addTargetListener = useCallback((onTarget: (t: DeepLinkTarget) => void) => {
    listeners.current.add(onTarget);
    return () => {
      listeners.current.delete(onTarget);
    };
  }, []);

  const value = useMemo<LinkingApi>(
    () => ({ providerName: provider.name, initialTarget, addTargetListener }),
    [provider.name, initialTarget, addTargetListener],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLinking(): LinkingApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLinking must be used inside <LinkingProviderScope>");
  return v;
}
