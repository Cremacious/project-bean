// apps/mobile/src/review/context.tsx
//
// The review-prompt context (issue #71): the one place the "rate and review" state
// and actions live, so the reader (which fires the milestone trigger) and the
// settings screen (the manual fallback) read the same truth. It owns the
// StoreReviewProvider and the locally persisted ReviewPromptState (how many times
// asked and when), and it enforces the policy:
//   - Ask ONLY at a genuine positive milestone (a good ending), never on launch,
//     never mid-story, never on a game over. The decision is core's pure
//     shouldRequestReview, so it is unit-tested off-device.
//   - Cap and cool down locally, on top of the OS's own rate-limiting; stop nagging.
//   - The native prompt is the OS's own; we never build a star UI, gate anything,
//     or offer an incentive. Ignoring it has zero downside.
//   - The manual "Rate Bedtime Quests" entry always works, regardless of the cap,
//     so a willing parent can review any time.
//
// State is persisted via the same key/value seam as the offline cache (AsyncStorage
// on device, in-memory elsewhere), so the cap survives app restarts on a real device.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  DEFAULT_REVIEW_PROMPT_CONFIG,
  INITIAL_REVIEW_PROMPT_STATE,
  parseReviewPromptState,
  recordReviewRequested,
  reviewInviteCopy,
  shouldRequestReview,
  type ReviewInviteCopy,
  type ReviewMilestone,
  type ReviewPromptConfig,
  type ReviewPromptState,
} from "@bedtime-quests/core/review-prompt";
import { createKeyValueStore } from "../cache";
import { createStoreReviewProvider, type StoreReviewProvider } from "./index";

/** Versioned so a future shape change can start fresh without misreading old data. */
const STORAGE_KEY = "review-prompt-state:v1";

/** What a milestone check did, for logging and the preview note (not user-facing). */
export type ReviewPromptOutcome = { requested: boolean; reason: string };

type ReviewPromptApi = {
  /** Which provider is active ("expo" on a device build, else "mock"). */
  providerName: StoreReviewProvider["name"];
  /** Whether a store listing URL exists, so settings can enable/disable the entry. */
  canOpenStoreListing: boolean;
  /** Parent-facing copy (dash-free) for the settings entry. */
  copy: ReviewInviteCopy;
  /**
   * Consider asking for a review after a GOOD ending. Reads the pure decision from
   * core, and only if eligible AND the OS prompt is available does it request the
   * native prompt and record it (advancing the cap + cooldown). Safe to call on
   * every good ending; it self-limits. Never throws.
   */
  maybePromptAfterGoodEnding: (milestone: ReviewMilestone) => Promise<ReviewPromptOutcome>;
  /** Open the store listing for the manual settings fallback. Never throws. */
  openStoreListing: () => Promise<boolean>;
};

const Ctx = createContext<ReviewPromptApi | null>(null);

export function ReviewPromptProviderScope({
  children,
  config = DEFAULT_REVIEW_PROMPT_CONFIG,
}: {
  children: ReactNode;
  /** Overridable so a dev build or a test can shorten thresholds/cooldown. */
  config?: ReviewPromptConfig;
}) {
  const provider = useMemo<StoreReviewProvider>(() => createStoreReviewProvider(), []);
  const store = useMemo(() => createKeyValueStore(), []);

  // The persisted state is the source of truth for capping/cooldown. Keep it in a
  // ref so the async milestone check never reads a stale copy across awaits. Nothing
  // renders from it (the cap is invisible to the family), so no React state is needed.
  const stateRef = useRef<ReviewPromptState>(INITIAL_REVIEW_PROMPT_STATE);
  const readyRef = useRef(false);

  // Load persisted state once. Until it is loaded we hold off asking, so a device
  // that already hit the cap is never re-prompted during the load race.
  useEffect(() => {
    let alive = true;
    store
      .getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        stateRef.current = parseReviewPromptState(raw);
        readyRef.current = true;
      })
      .catch(() => {
        if (alive) readyRef.current = true;
      });
    return () => {
      alive = false;
    };
  }, [store]);

  const maybePromptAfterGoodEnding = useCallback(
    async (milestone: ReviewMilestone): Promise<ReviewPromptOutcome> => {
      try {
        // Do not decide before the persisted cap/cooldown has loaded.
        if (!readyRef.current) return { requested: false, reason: "loading" };

        const decision = shouldRequestReview(milestone, stateRef.current, Date.now(), config);
        if (!decision.ask) return { requested: false, reason: decision.reason };

        // Eligible by our rules; now respect the platform. If the OS prompt cannot
        // be shown here (web, TestFlight, module absent) do NOT burn our cap: leave
        // the state untouched so a production build can still ask later.
        const available = await provider.isAvailable();
        if (!available) return { requested: false, reason: "unavailable" };

        const now = Date.now();
        const ok = await provider.requestReview();
        // We asked the OS (it decides whether to actually show it and rate-limits
        // it); record the request so our own cap + cooldown advance regardless.
        const next = recordReviewRequested(stateRef.current, now);
        stateRef.current = next;
        store.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return { requested: ok, reason: "requested" };
      } catch {
        // A review prompt is a bonus; never let it disrupt the session.
        return { requested: false, reason: "error" };
      }
    },
    [provider, store, config],
  );

  const openStoreListing = useCallback(() => provider.openStoreListing(), [provider]);

  const value = useMemo<ReviewPromptApi>(
    () => ({
      providerName: provider.name,
      canOpenStoreListing: provider.storeUrl() !== null,
      copy: reviewInviteCopy(),
      maybePromptAfterGoodEnding,
      openStoreListing,
    }),
    [provider, maybePromptAfterGoodEnding, openStoreListing],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReviewPrompt(): ReviewPromptApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReviewPrompt must be used inside <ReviewPromptProviderScope>");
  return v;
}
