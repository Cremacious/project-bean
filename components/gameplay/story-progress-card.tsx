// components/gameplay/story-progress-card.tsx
import Link from "next/link";
import { StoryCover } from "@/components/story/story-cover";
import type { CollectionStory } from "@/lib/gameplay/collection";

export function StoryProgressCard({ story }: { story: CollectionStory }) {
  const { slug, title, goodFound, goodTotal, complete, surprises } = story;
  const pct = goodTotal > 0 ? Math.round((goodFound / goodTotal) * 100) : 0;

  return (
    <Link
      href={`/story/${slug}`}
      className="flex items-center gap-4 rounded-3xl border border-[var(--pc-line)] p-4 shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
      style={{ background: complete ? "#E6F7EF" : "white" }}
    >
      <div className="relative h-[62px] w-[62px] flex-none overflow-hidden rounded-2xl border border-[var(--pc-line)]">
        <StoryCover slug={slug} className="h-full w-full" />
        {complete && (
          <span
            aria-label="Story complete"
            className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold text-white shadow-[0_2px_0_var(--pc-leaf-ink)]"
            style={{ background: "var(--pc-leaf)" }}
          >
            ✓
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-bold text-[var(--pc-ink)] sm:text-lg">{title}</h3>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--pc-line)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: complete ? "var(--pc-leaf)" : "var(--pc-plum)",
              }}
            />
          </div>
          <span className="flex-none text-xs font-extrabold text-[var(--pc-ink)]">
            {goodFound}/{goodTotal}
          </span>
        </div>

        {surprises > 0 && (
          <p className="mt-1.5 text-xs font-bold text-[var(--pc-sub)]">
            {surprises === 1 ? "1 surprise found" : `${surprises} surprises found`}
          </p>
        )}
      </div>
    </Link>
  );
}
