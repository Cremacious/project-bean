// apps/mobile/src/navigation/Navigator.tsx
//
// A tiny typed stack navigator built on React state, so this UI port stays
// dependency-light (no react-navigation / expo-router). It is the single place
// the screen flow is decided:
//   signed out              -> AuthScreen
//   signed in, no reader     -> ChildPickerScreen
//   signed in, reader chosen -> the route stack (Library by default)
//
// SEAM: swapping in React Navigation or Expo Router later means replacing this
// file and the useNav() calls in screens; the screens themselves are unchanged.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppData } from "../data/store";
import type { Route } from "./types";
import { AuthScreen } from "../screens/AuthScreen";
import { ChildPickerScreen } from "../screens/ChildPickerScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { StoryReaderScreen } from "../screens/StoryReaderScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";

type Nav = {
  navigate: (route: Route) => void;
  goBack: () => void;
  resetToLibrary: () => void;
  canGoBack: boolean;
};

const NavCtx = createContext<Nav | null>(null);

export function useNav(): Nav {
  const v = useContext(NavCtx);
  if (!v) throw new Error("useNav must be used inside <Navigator>");
  return v;
}

const HOME: Route = { name: "Library" };

export function Navigator() {
  const { session, activeChild } = useAppData();
  const [stack, setStack] = useState<Route[]>([HOME]);

  // Whenever the active reader changes (picked, switched, or cleared), start the
  // stack fresh at the library so a new reader never lands mid-flow.
  useEffect(() => {
    setStack([HOME]);
  }, [activeChild?.id, session.status]);

  const navigate = useCallback((route: Route) => setStack((s) => [...s, route]), []);
  const goBack = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const resetToLibrary = useCallback(() => setStack([HOME]), []);

  const nav = useMemo<Nav>(
    () => ({ navigate, goBack, resetToLibrary, canGoBack: stack.length > 1 }),
    [navigate, goBack, resetToLibrary, stack.length],
  );

  let body: ReactNode;
  if (session.status === "signedOut") {
    body = <AuthScreen />;
  } else if (!activeChild) {
    body = <ChildPickerScreen />;
  } else {
    const top = stack[stack.length - 1];
    switch (top.name) {
      case "Library":
        body = <LibraryScreen />;
        break;
      case "Reader":
        body = <StoryReaderScreen slug={top.slug} />;
        break;
      case "Paywall":
        body = <PaywallScreen storySlug={top.storySlug} storyTitle={top.storyTitle} />;
        break;
      case "Achievements":
        body = <AchievementsScreen />;
        break;
    }
  }

  return <NavCtx.Provider value={nav}>{body}</NavCtx.Provider>;
}
