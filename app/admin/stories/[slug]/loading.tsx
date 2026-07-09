// app/admin/stories/[slug]/loading.tsx
// Instant loading state for the admin story editor (issue #9). A light set of
// stacked panel placeholders while the story, pages, and choices load.
import { Skeleton } from "@/components/ui/skeleton";

export default function StoryEditorLoading() {
  return (
    <section role="status" aria-label="Loading story editor" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">Loading story editor</span>

      {/* Top bar: back link + actions */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-28 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-24 rounded-2xl" />
          <Skeleton className="h-11 w-28 rounded-2xl" />
        </div>
      </div>

      {/* Title */}
      <Skeleton className="h-8 w-1/2 max-w-sm rounded-lg" />

      {/* Panels */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-3xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)] sm:p-6"
        >
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      ))}
    </section>
  );
}
