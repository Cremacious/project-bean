// app/(app)/page.tsx
import Link from "next/link";
import { getReader } from "@/lib/session";
import { getLibraryForReader } from "@/lib/stories/queries";
import { StoryCover } from "@/components/story/story-cover";

export default async function LibraryPage() {
  const reader = (await getReader())!;
  const stories = await getLibraryForReader(reader.id);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Pick a{" "}
          <span className="relative inline-block">
            <span className="relative z-10">story</span>
            <span className="absolute inset-x-[-2px] bottom-1 z-0 h-2.5 -rotate-1 rounded" style={{ background: "var(--pc-sun)" }} />
          </span>
          , {reader.displayName}!
        </h1>
      </div>

      {stories.length === 0 ? (
        <p className="text-[var(--pc-sub)]">No stories yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <Link
              key={s.id}
              href={`/story/${s.slug}`}
              className="group flex overflow-hidden rounded-3xl border border-[var(--pc-line)] bg-white shadow-[0_10px_22px_-14px_rgba(22,40,58,0.45)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] hover:-translate-y-0.5 sm:flex-col"
            >
              <StoryCover slug={s.slug} className="h-full min-h-[7rem] w-24 flex-none sm:h-28 sm:w-full" />
              <div className="flex flex-col gap-2 p-4">
                <h2 className="font-display text-lg font-bold leading-tight">{s.title}</h2>
                <p className="text-sm text-[var(--pc-sub)]">{s.description}</p>
                <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E6F7F0] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-leaf-ink)]">
                  ★ Tap to read
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
