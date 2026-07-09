// app/(app)/family/loading.tsx
// Instant loading state for the family screen (issue #9). Mirrors the reader
// rows and the "Add a child" form card.
import { Skeleton } from "@/components/ui/skeleton";

export default function FamilyLoading() {
  return (
    <section
      role="status"
      aria-label="Loading your family"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6"
    >
      <span className="sr-only">Loading your family</span>

      {/* Title */}
      <Skeleton className="h-9 w-1/2 max-w-xs sm:h-10" />

      {/* Reader rows */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-3xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_5px_0_var(--pc-line)]"
          >
            <Skeleton className="h-12 w-12 flex-none rounded-full" />
            <Skeleton className="h-5 w-32 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Add a child form */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <div className="flex flex-col gap-4 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)] sm:p-6">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-40 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}
