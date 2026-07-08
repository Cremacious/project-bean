// app/admin/page.tsx
import Link from "next/link";
import { listAdminStories } from "@/lib/admin/queries";

const AGE_LABELS: Record<string, string> = { "2-4": "2 to 4", "5-7": "5 to 7", "8+": "8 and up" };

export default async function AdminHome() {
  const stories = await listAdminStories();
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Stories</h1>
        <Link
          href="/admin/stories/new"
          className="rounded-2xl bg-[var(--pc-plum)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
        >
          New story
        </Link>
      </div>

      {stories.length === 0 ? (
        <p className="text-[var(--pc-sub)]">No stories yet. Create your first one.</p>
      ) : (
        <ul className="space-y-2">
          {stories.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/stories/${s.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-3 shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-bold">{s.title}</span>
                  <span className="text-xs text-[var(--pc-sub)]">
                    {s.ageBand ? `Ages ${AGE_LABELS[s.ageBand] ?? s.ageBand}` : "No age band"}
                  </span>
                </span>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    s.published ? "bg-[#E6F7F0] text-[var(--pc-leaf-ink)]" : "bg-[#FDECEC] text-[var(--pc-poppy-ink)]"
                  }`}
                >
                  {s.published ? "Published" : "Draft"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
