// app/admin/loading.tsx
// Instant loading state for the admin story list (issue #9).
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <section role="status" aria-label="Loading stories" className="flex flex-1 flex-col gap-5">
      <span className="sr-only">Loading stories</span>

      {/* Header row: title + new story button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-2xl" />
      </div>

      {/* Story rows */}
      <ul className="flex-1 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 shadow-[0_4px_0_var(--pc-line)]">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-20 flex-none rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
