// components/admin/pages-panel.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/lib/admin-actions";
import { field, labelCls } from "@/components/admin/styles";
import { PageEditor } from "@/components/admin/page-editor";
import type { ChoiceRow } from "@/components/admin/choices-editor";

type PageItem = { id: number; key: string; body: string; isEnding: boolean; endingLabel: string | null; endingType: string };
type ChoiceItem = { id: number; pageId: number; toPageKey: string; label: string; order: number };

export function PagesPanel({
  storyId, pages, choices,
}: {
  storyId: number;
  pages: PageItem[];
  choices: ChoiceItem[];
}) {
  const router = useRouter();
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pageKeys = pages.map((p) => p.key);

  function addPage() {
    setError(null);
    const key = newKey.trim();
    if (!key) return;
    startTransition(async () => {
      const res = await createPage(storyId, key);
      if (res.ok) {
        setNewKey("");
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-extrabold">Pages</h2>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--pc-line)] bg-white p-3 shadow-[0_4px_0_var(--pc-line)]">
        <input
          className={`${field} w-56`}
          value={newKey}
          placeholder="new-page-key"
          disabled={isPending}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <button
          type="button"
          onClick={addPage}
          disabled={isPending || !newKey.trim()}
          className="rounded-2xl bg-[var(--pc-plum)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add page"}
        </button>
        {error && <p className={`text-sm font-semibold text-[var(--pc-poppy-ink)]`}>{error}</p>}
      </div>

      {pages.length === 0 ? (
        <p className={labelCls + " text-[var(--pc-sub)]"}>No pages yet. Add your first one above.</p>
      ) : (
        <div className="space-y-4">
          {pages.map((p) => {
            const rows: ChoiceRow[] = choices
              .filter((c) => c.pageId === p.id)
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((c) => ({ label: c.label, toPageKey: c.toPageKey }));
            return <PageEditor key={p.id} page={p} pageKeys={pageKeys} choices={rows} />;
          })}
        </div>
      )}
    </section>
  );
}
