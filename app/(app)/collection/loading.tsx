// app/(app)/collection/loading.tsx
// Instant loading state for a reader's collection (issue #9). Mirrors the stat
// tiles, story progress rows, and badge grid of the real screen.
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <section role="status" aria-label="Loading collection" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">Loading collection</span>

      {/* Title */}
      <Skeleton className="h-9 w-1/2 max-w-xs sm:h-10" />

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-3xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_5px_0_var(--pc-line)]"
          >
            <Skeleton className="h-8 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Your stories */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-lg" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-3xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_5px_0_var(--pc-line)]"
          >
            <Skeleton className="h-12 w-12 flex-none rounded-2xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-3 w-3/4 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-3xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_5px_0_var(--pc-line)]"
            >
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
