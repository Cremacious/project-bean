// components/gameplay/collection-view.tsx
import type { Collection } from "@/lib/gameplay/collection";
import { StoryProgressCard } from "@/components/gameplay/story-progress-card";
import { BadgeGrid } from "@/components/gameplay/badge-grid";

export function CollectionView({ childName, data }: { childName: string; data: Collection }) {
  const { stats, stories, badges } = data;

  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
        {childName}&apos;s Collection
      </h1>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Endings found" value={stats.endingsFound} />
        <StatTile label="Stories finished" value={stats.storiesCompleted} />
        <StatTile label="Surprises found" value={stats.surprises} />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold text-[var(--pc-ink)]">Your stories</h2>
        {stories.length === 0 ? (
          <p className="text-[var(--pc-sub)]">No stories yet.</p>
        ) : (
          <div className="space-y-3">
            {stories.map((s) => (
              <StoryProgressCard key={s.slug} story={s} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold text-[var(--pc-ink)]">Badges</h2>
        <BadgeGrid badges={badges} />
      </div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[var(--pc-line)] bg-white p-4 text-center shadow-[0_5px_0_var(--pc-line)]">
      <p className="font-display text-2xl font-extrabold text-[var(--pc-plum-ink)] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold text-[var(--pc-sub)] sm:text-sm">{label}</p>
    </div>
  );
}
