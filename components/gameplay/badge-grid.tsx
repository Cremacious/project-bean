// components/gameplay/badge-grid.tsx
import type { Badge } from "@bedtime-quests/core/gameplay/progress";

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex flex-col items-center gap-2 rounded-3xl border border-[var(--pc-line)] bg-white p-4 text-center shadow-[0_5px_0_var(--pc-line)]"
        >
          <span
            aria-hidden="true"
            className="grid h-14 w-14 place-items-center rounded-full text-2xl"
            style={{ background: badge.earned ? "var(--pc-sun)" : "var(--pc-line)" }}
          >
            {badge.earned ? badge.icon : "🔒"}
          </span>
          <p className="font-display text-sm font-bold text-[var(--pc-ink)]">{badge.label}</p>
        </div>
      ))}
    </div>
  );
}
