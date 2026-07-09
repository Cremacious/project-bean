// app/(app)/story/[slug]/loading.tsx
// Instant loading state for the story reader (issue #9). Mirrors the reader's
// max-w-2xl column, a title bar, a card of story text, and choice buttons.
import { Skeleton } from "@/components/ui/skeleton";

export default function StoryLoading() {
  return (
    <div
      role="status"
      aria-label="Loading story"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6"
    >
      <span className="sr-only">Loading story</span>

      {/* Title + reading settings control */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      {/* Story text card */}
      <div className="flex flex-1 flex-col gap-3 rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_5px_0_var(--pc-line)] sm:p-8">
        {["w-full", "w-11/12", "w-full", "w-10/12", "w-full", "w-2/3"].map((w, i) => (
          <Skeleton key={i} className={`h-5 rounded-lg ${w}`} />
        ))}
      </div>

      {/* Choice buttons */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
