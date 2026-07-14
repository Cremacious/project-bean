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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DeepLinkTarget } from "@bedtime-quests/core/deep-links";
import { useAppData } from "../data/store";
import type { Route } from "./types";
import { AuthScreen } from "../screens/AuthScreen";
import { ChildPickerScreen } from "../screens/ChildPickerScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { StoryReaderScreen } from "../screens/StoryReaderScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useReminders } from "../notifications/context";
import { useLinking } from "../linking/context";

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
  const { session, activeChild, getStory } = useAppData();
  const { addTapListener } = useReminders();
  const { initialTarget, addTargetListener } = useLinking();
  const [stack, setStack] = useState<Route[]>([HOME]);

  const navigate = useCallback((route: Route) => setStack((s) => [...s, route]), []);
  const goBack = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const resetToLibrary = useCallback(() => setStack([HOME]), []);

  // Turn a deep-link target (issue #65) into a full stack, rooted at the library
  // so system "back" always returns there. An unknown story slug degrades to the
  // library rather than opening a broken reader (requirement 2).
  const stackForTarget = useCallback(
    (target: DeepLinkTarget): Route[] => {
      switch (target.screen) {
        case "reader":
          return getStory(target.slug) ? [HOME, { name: "Reader", slug: target.slug }] : [HOME];
        case "collection":
          return [HOME, { name: "Achievements" }];
        case "library":
        default:
          return [HOME];
      }
    },
    [getStory],
  );

  // A cold-start link (app launched from a tap) can arrive BEFORE the auth/reader
  // gates are passed. We stash it and honor it the moment the app is ready, so a
  // tapped story link still lands on that story after sign in + reader pick.
  const canHonor = session.status === "signedIn" && !!activeChild;
  const canHonorRef = useRef(canHonor);
  canHonorRef.current = canHonor;
  const pendingRef = useRef<DeepLinkTarget | null>(null);

  const goToTarget = useCallback(
    (target: DeepLinkTarget) => {
      if (canHonorRef.current) setStack(stackForTarget(target));
      else pendingRef.current = target; // honor after the gates (see effect below)
    },
    [stackForTarget],
  );

  // Gate transitions (reader picked/switched/cleared, or sign in/out): normally
  // start fresh at the library so a new reader never lands mid-flow. But if a link
  // is waiting (cold start, or arrived while signed out), honor it now instead.
  useEffect(() => {
    if (session.status === "signedIn" && activeChild) {
      const pending = pendingRef.current;
      pendingRef.current = null;
      setStack(pending ? stackForTarget(pending) : [HOME]);
    } else {
      setStack([HOME]);
    }
    // Intentionally keyed only on the gate identity, not on stackForTarget, so a
    // reader switch resets to the library exactly as before (#54 behavior).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild?.id, session.status]);

  // The link that cold-started the app (resolved async by the linking context).
  useEffect(() => {
    if (initialTarget) goToTarget(initialTarget);
  }, [initialTarget, goToTarget]);

  // Links delivered while the app is already running (backgrounded -> foreground).
  useEffect(() => addTargetListener(goToTarget), [addTargetListener, goToTarget]);

  // Tapping a bedtime reminder (issue #56) reuses the SAME routing as a link to the
  // library target, so the notification tap and a home deep link land identically.
  useEffect(() => addTapListener(() => goToTarget({ screen: "library" })), [addTapListener, goToTarget]);

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
      case "Settings":
        body = <SettingsScreen />;
        break;
    }
  }

  return <NavCtx.Provider value={nav}>{body}</NavCtx.Provider>;
}
