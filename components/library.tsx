// components/library.tsx
import Link from "next/link";
import { isNewStory } from "@bedtime-quests/core/changelog";
import type { Child } from "@/lib/children";
import { getCatalog } from "@/lib/stories/queries";
import { StoryCover } from "@/components/story/story-cover";
import { EmptyState } from "@/components/ui/empty-state";
import { AdSlot } from "@/components/ads/ad-slot";

const AGE_BANDS = [
  { id: "2-4", label: "2 to 4" },
  { id: "5-7", label: "5 to 7" },
  { id: "8+", label: "8 and up" },
] as const;

// Maps a stored ageBand KEY (e.g. "2-4") to a dash-free display label (rule 1).
// The keys themselves (and the `?age=` query param) are unchanged.
function ageBandLabel(ageBand: string): string {
  const match = AGE_BANDS.find((band) => band.id === ageBand);
  return match ? match.label : ageBand;
}

export async function Library({ activeChild, ageBand }: { activeChild: Child; ageBand?: string }) {
  const stories = await getCatalog(ageBand);
  // "New" badge window (issue #74): stamped once per render so every card is
  // judged against the same moment.
  const now = new Date();
  const nameParts = activeChild.name.trim().split(/\s+/);
  const lastWord = nameParts[nameParts.length - 1] ?? activeChild.name;
  const nameLead = nameParts.slice(0, -1).join(" ");

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--pc-ink)] sm:text-4xl">
          What shall we read,{" "}
          {nameLead && <span>{nameLead} </span>}
          <span className="relative inline-block">
            <span className="relative z-10">{lastWord}</span>
            <span
              className="absolute inset-x-[-2px] bottom-1 z-0 h-2.5 -rotate-1 rounded"
              style={{ background: "var(--pc-sun)" }}
            />
          </span>?
        </h1>
      </div>

      <nav aria-label="Filter by age" className="flex flex-wrap gap-2">
        <Link
          href="/"
          className="min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          style={
            !ageBand
              ? { borderColor: "var(--pc-plum)", background: "var(--accent)", color: "var(--pc-plum-ink)" }
              : { borderColor: "var(--pc-line)", background: "white", color: "var(--pc-ink)" }
          }
        >
          All
        </Link>
        {AGE_BANDS.map((band) => {
          const active = ageBand === band.id;
          return (
            <Link
              key={band.id}
              href={`/?age=${encodeURIComponent(band.id)}`}
              className="min-h-[44px] rounded-full border-2 px-4 py-2 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              style={
                active
                  ? { borderColor: "var(--pc-plum)", background: "var(--accent)", color: "var(--pc-plum-ink)" }
                  : { borderColor: "var(--pc-line)", background: "white", color: "var(--pc-ink)" }
              }
            >
              Ages {band.label}
            </Link>
          );
        })}
      </nav>

      {stories.length === 0 ? (
        ageBand ? (
          <EmptyState
            emoji="🔍"
            title="No stories in this age group yet"
            description="Try a different age, or peek at all of the stories we have so far."
            action={{ href: "/", label: "See all stories" }}
          />
        ) : (
          <EmptyState
            emoji="🌙"
            title="New stories are on the way"
            description="Fresh adventures are being written right now. Check back soon for your next bedtime quest."
          />
        )
      ) : (
        <div className="grid flex-1 content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <Link
              key={s.id}
              href={`/story/${s.slug}`}
              className="group flex overflow-hidden rounded-3xl border border-[var(--pc-line)] bg-white shadow-[0_5px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 sm:flex-col"
            >
              <StoryCover slug={s.slug} motif={s.coverMotif} imageUrl={s.coverImageUrl} className="h-full min-h-[7rem] w-24 flex-none sm:h-28 sm:w-full" />
              <div className="flex flex-col gap-2 p-4">
                <h2 className="font-display text-lg font-bold leading-tight text-[var(--pc-ink)]">{s.title}</h2>
                <p className="text-sm text-[var(--pc-sub)]">{s.description}</p>
                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  {/* Decorative "New" badge for recently published stories (issue
                      #74). Not interactive: the card is the clickable thing (UI
                      rule 2), so this carries no button affordance or cursor. */}
                  {isNewStory(s.createdAt, now) && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--pc-poppy)] px-2.5 py-1 text-xs font-extrabold text-white">
                      New
                    </span>
                  )}
                  {s.ageBand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#F0EEFF] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-plum-ink)]">
                      Ages {ageBandLabel(s.ageBand)}
                    </span>
                  )}
                  {s.premium ? (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#FFE7DC] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-ink)]">
                      🔒 Premium
                    </span>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#E6F7F0] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-leaf-ink)]">
                      Free
                    </span>
                  )}
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#FFF3D6] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-ink)]">
                    ★ {s.premium ? "Tap to unlock" : "Tap to read"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Free-tier ad slot (#37). Renders only for free parents; below the grid so
          it never sits between story cards, and never on the reader itself. */}
      <AdSlot placement="library" />
    </section>
  );
}
