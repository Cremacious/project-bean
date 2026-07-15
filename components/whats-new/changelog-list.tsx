// components/whats-new/changelog-list.tsx
//
// Renders the shared changelog (packages/core changelog.ts) as a readable list of
// dated releases, each with its "New stories", "Improvements", and "Fixes" groups
// (issue #74). It has no client state, so the SAME component renders both the
// public /whats-new page and the in-app "What's new" dialog, which is exactly why
// the two surfaces can never drift.
//
// UI rules (docs/WORKFLOW.md): all copy is dash free and high contrast. Nothing
// here is clickable, so nothing mimics a button; the group pills are decorative
// labels with the default cursor.
import { CHANGELOG, WHATS_NEW_COPY, type ChangelogEntry } from "@bedtime-quests/core/changelog";

// A stable, human date like "15 July 2026", built without locale surprises so it
// reads the same everywhere. Dash free by construction.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const GROUPS: Array<{ key: "newStories" | "improvements" | "fixes"; label: string; tone: string }> = [
  { key: "newStories", label: WHATS_NEW_COPY.groups.newStories, tone: "bg-[#E6F7F0] text-[var(--pc-leaf-ink)]" },
  { key: "improvements", label: WHATS_NEW_COPY.groups.improvements, tone: "bg-[#F0EEFF] text-[var(--pc-plum-ink)]" },
  { key: "fixes", label: WHATS_NEW_COPY.groups.fixes, tone: "bg-[#FFF3D6] text-[var(--pc-ink)]" },
];

function Group({ label, tone, items }: { label: string; tone: string; items: string[] }) {
  return (
    <div className="mt-4 first:mt-0">
      <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold ${tone}`}>
        {label}
      </span>
      <ul className="mt-2 space-y-1.5 pl-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[15px] font-medium leading-relaxed text-[var(--pc-ink)]">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[var(--pc-plum)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntryCard({ entry }: { entry: ChangelogEntry }) {
  return (
    <article className="rounded-3xl border-2 border-[var(--pc-line)] bg-white p-5 shadow-[0_5px_0_var(--pc-line)] sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-xl font-extrabold tracking-tight text-[var(--pc-ink)]">
          {entry.title}
        </h3>
        <p className="text-sm font-bold text-[var(--pc-sub)]">{formatDate(entry.date)}</p>
      </header>
      <div className="mt-3">
        {GROUPS.map((g) => {
          const items = entry[g.key];
          if (!items || items.length === 0) return null;
          return <Group key={g.key} label={g.label} tone={g.tone} items={items} />;
        })}
      </div>
    </article>
  );
}

export function ChangelogList({ entries = CHANGELOG }: { entries?: ChangelogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-3xl border-2 border-[var(--pc-line)] bg-white p-6 text-base font-medium text-[var(--pc-ink)] shadow-[0_5px_0_var(--pc-line)]">
        {WHATS_NEW_COPY.empty}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
