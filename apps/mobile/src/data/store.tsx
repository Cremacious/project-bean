// apps/mobile/src/data/store.tsx
//
// The local, in-memory data layer for this UI port. It implements the app's data
// needs entirely on-device so the full flow (sign in, pick a reader, read to an
// ending, see progress) works with no backend, and it drives ALL gameplay and
// gating decisions through @bedtime-quests/core so the rules match web exactly.
//
// What is real here and what is a stand-in:
//  - Auth is a local stub (no network). Real BetterAuth wiring is deferred (#55
//    area); see README. Sign up starts an account with no readers (first-reader
//    onboarding); sign in returns a seeded reader so the picker has someone.
//  - Entitlement defaults to NOT_SUBSCRIBED, so premium stories show the paywall.
//    Purchasing is deferred to native billing (#55): "subscribe" routes to a
//    placeholder and never fakes a grant, mirroring the web app.
//  - Progress lives in memory for the session (no persistence yet; a real store
//    would use the backend + secure storage).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { graphFromStoryInput } from "@bedtime-quests/core/stories/from-input";
import { computeStoryProgress, type StoryProgress } from "@bedtime-quests/core/gameplay/progress";
import { buildCollection, type Collection, type StoryRow, type EndingRow } from "@bedtime-quests/core/gameplay/collection";
import { isStoryUnlocked } from "@bedtime-quests/core/stories/access";
import { NOT_SUBSCRIBED, type Subscription } from "@bedtime-quests/core/entitlements";
import type { StoryInput } from "@bedtime-quests/core/stories/story-types";
import type { ReadingFontId, ReadingSizeId } from "@bedtime-quests/core/reading-prefs";
import { STORIES, getStoryInput, isPremium } from "../content";
import type { CatalogStory, ChildProfile, ReadingMode } from "./types";

export type EndingProgress = StoryProgress & { endingType: string };

type SessionState = { status: "signedOut" | "signedIn"; parentName: string | null };

// A namespaced page id so endings stay unique across stories in buildCollection.
const globalId = (storyId: number, localId: number) => storyId * 1000 + localId;

// Stable story ids by catalog order (1-based), reused by progress + collection.
const STORY_ID: Record<string, number> = {};
STORIES.forEach((s, i) => {
  STORY_ID[s.slug] = i + 1;
});

const CATALOG: CatalogStory[] = STORIES.map((s) => ({
  slug: s.slug,
  title: s.title,
  description: s.description ?? "",
  ageBand: s.ageBand ?? null,
  coverMotif: s.coverMotif ?? null,
  premium: isPremium(s),
}));

const SEED_CHILD: ChildProfile = {
  id: 1,
  name: "Ava",
  readingMode: "read_to_me",
  readerFont: "rounded",
  readerFontSize: "md",
};

type AppData = {
  session: SessionState;
  signInEmail: (email: string, password: string) => void;
  signUpEmail: (name: string, email: string, password: string) => void;
  signInSocial: (provider: "google" | "apple") => void;
  signOut: () => void;

  children: ChildProfile[];
  activeChild: ChildProfile | null;
  setActiveChild: (id: number) => void;
  clearActiveChild: () => void;
  createChild: (name: string, mode: ReadingMode) => number;
  updateChild: (id: number, patch: { name?: string; readingMode?: ReadingMode }) => void;
  removeChild: (id: number) => void;
  setReadingPrefs: (childId: number, font: ReadingFontId, size: ReadingSizeId) => void;

  catalog: CatalogStory[];
  getStory: (slug: string) => StoryInput | undefined;
  storyUnlocked: (premium: boolean) => boolean;
  entitlement: Subscription;

  recordEnding: (childId: number, slug: string, pageKey: string) => EndingProgress | null;
  getStoryProgress: (childId: number, slug: string) => StoryProgress;
  getCollection: (childId: number) => Collection;
};

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children: node }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: "signedOut", parentName: null });
  const [kids, setKids] = useState<ChildProfile[]>([SEED_CHILD]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(2);
  // Endings found per child, keyed "slug:pageKey".
  const [found, setFound] = useState<Record<number, string[]>>({});
  const [entitlement] = useState<Subscription>(NOT_SUBSCRIBED);

  const signInEmail = useCallback((email: string, _password: string) => {
    const local = email.split("@")[0] || "there";
    setSession({ status: "signedIn", parentName: local.charAt(0).toUpperCase() + local.slice(1) });
  }, []);
  const signUpEmail = useCallback((name: string, _email: string, _password: string) => {
    setKids([]); // brand new account: no readers yet -> first reader onboarding
    setActiveId(null);
    setSession({ status: "signedIn", parentName: name.trim() || "Grown up" });
  }, []);
  const signInSocial = useCallback((_provider: "google" | "apple") => {
    setSession({ status: "signedIn", parentName: "Grown up" });
  }, []);
  const signOut = useCallback(() => {
    setSession({ status: "signedOut", parentName: null });
    setKids([SEED_CHILD]);
    setActiveId(null);
    setFound({});
    setNextId(2);
  }, []);

  const setActiveChild = useCallback((id: number) => setActiveId(id), []);
  const clearActiveChild = useCallback(() => setActiveId(null), []);

  const createChild = useCallback(
    (name: string, mode: ReadingMode) => {
      const id = nextId;
      const child: ChildProfile = {
        id,
        name: name.trim(),
        readingMode: mode,
        readerFont: "rounded",
        readerFontSize: "md",
      };
      setKids((prev) => [...prev, child]);
      setNextId((n) => n + 1);
      return id;
    },
    [nextId],
  );
  const updateChild = useCallback((id: number, patch: { name?: string; readingMode?: ReadingMode }) => {
    setKids((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...(patch.name !== undefined ? { name: patch.name.trim() } : null), ...(patch.readingMode ? { readingMode: patch.readingMode } : null) }
          : c,
      ),
    );
  }, []);
  const removeChild = useCallback(
    (id: number) => {
      setKids((prev) => prev.filter((c) => c.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
      setFound((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [],
  );
  const setReadingPrefs = useCallback((childId: number, font: ReadingFontId, sz: ReadingSizeId) => {
    setKids((prev) => prev.map((c) => (c.id === childId ? { ...c, readerFont: font, readerFontSize: sz } : c)));
  }, []);

  const getStory = useCallback((slug: string) => getStoryInput(slug), []);
  const storyUnlocked = useCallback((premium: boolean) => isStoryUnlocked(premium, entitlement), [entitlement]);

  // Ending refs + found ids for one story, from the authored content.
  const storyEndings = useCallback((slug: string, childId: number) => {
    const story = getStoryInput(slug);
    if (!story) return { endings: [] as { pageId: number; endingType: string }[], foundPageIds: [] as number[], idByKey: {} as Record<string, number> };
    const built = graphFromStoryInput(story);
    const endings = Object.values(built.graph.pages)
      .filter((p) => p.isEnding)
      .map((p) => ({ pageId: p.id, endingType: p.endingType }));
    const mine = found[childId] ?? [];
    const foundPageIds = mine
      .filter((k) => k.startsWith(`${slug}:`))
      .map((k) => built.idByKey[k.slice(slug.length + 1)])
      .filter((n): n is number => typeof n === "number");
    return { endings, foundPageIds, idByKey: built.idByKey };
  }, [found]);

  const getStoryProgress = useCallback(
    (childId: number, slug: string): StoryProgress => {
      const { endings, foundPageIds } = storyEndings(slug, childId);
      return computeStoryProgress(endings, foundPageIds);
    },
    [storyEndings],
  );

  const recordEnding = useCallback(
    (childId: number, slug: string, pageKey: string): EndingProgress | null => {
      const story = getStoryInput(slug);
      if (!story) return null;
      const built = graphFromStoryInput(story);
      const page = built.graph.pages[pageKey];
      if (!page || !page.isEnding) return null;

      const key = `${slug}:${pageKey}`;
      const nextFound = { ...found };
      const mine = new Set(nextFound[childId] ?? []);
      mine.add(key);
      nextFound[childId] = [...mine];
      setFound(nextFound);

      // Recompute progress from the just-updated set (setState is async).
      const endings = Object.values(built.graph.pages)
        .filter((p) => p.isEnding)
        .map((p) => ({ pageId: p.id, endingType: p.endingType }));
      const foundPageIds = nextFound[childId]
        .filter((k) => k.startsWith(`${slug}:`))
        .map((k) => built.idByKey[k.slice(slug.length + 1)])
        .filter((n): n is number => typeof n === "number");
      const progress = computeStoryProgress(endings, foundPageIds);
      return { ...progress, endingType: page.endingType };
    },
    [found],
  );

  const getCollection = useCallback(
    (childId: number): Collection => {
      const storyRows: StoryRow[] = [];
      const endingRows: EndingRow[] = [];
      const foundIds: number[] = [];
      const mine = found[childId] ?? [];

      for (const story of STORIES) {
        const storyId = STORY_ID[story.slug];
        storyRows.push({
          id: storyId,
          slug: story.slug,
          title: story.title,
          ageBand: story.ageBand ?? null,
          coverImageUrl: null,
          coverMotif: story.coverMotif ?? null,
        });
        const built = graphFromStoryInput(story);
        for (const p of Object.values(built.graph.pages)) {
          if (p.isEnding) {
            endingRows.push({ id: globalId(storyId, p.id), storyId, endingType: p.endingType, isEnding: true });
          }
        }
        for (const k of mine) {
          if (k.startsWith(`${story.slug}:`)) {
            const local = built.idByKey[k.slice(story.slug.length + 1)];
            if (typeof local === "number") foundIds.push(globalId(storyId, local));
          }
        }
      }
      return buildCollection(storyRows, endingRows, foundIds);
    },
    [found],
  );

  const activeChild = useMemo(() => kids.find((c) => c.id === activeId) ?? null, [kids, activeId]);

  const value: AppData = {
    session,
    signInEmail,
    signUpEmail,
    signInSocial,
    signOut,
    children: kids,
    activeChild,
    setActiveChild,
    clearActiveChild,
    createChild,
    updateChild,
    removeChild,
    setReadingPrefs,
    catalog: CATALOG,
    getStory,
    storyUnlocked,
    entitlement,
    recordEnding,
    getStoryProgress,
    getCollection,
  };

  return <Ctx.Provider value={value}>{node}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used inside <AppDataProvider>");
  return v;
}
