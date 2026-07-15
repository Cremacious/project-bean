// components/admin/add-page-control.tsx
// A small control on the story graph page to add a new page by key, then jump
// straight into its editor. Replaces the add-page input that lived in the old
// PagesPanel.
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/lib/admin-actions";
import { isValidSlug } from "@bedtime-quests/core/admin/slugs";
import { field } from "@/components/admin/styles";

export function AddPageControl({ storyId, slug }: { storyId: number; slug: string }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function add() {
    const clean = key.trim();
    if (!clean) { setError("Please enter a key for the new page."); return; }
    if (!isValidSlug(clean)) { setError("Use lowercase words joined by single hyphens, like forest-path."); return; }
    setError(null);
    startTransition(async () => {
      const res = await createPage(storyId, clean);
      if (res.ok) { router.push(`/admin/stories/${slug}/pages/${clean}`); return; }
      setError(res.error ?? "We could not add this page. Please try again.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--pc-line)] bg-white p-3 shadow-[0_4px_0_var(--pc-line)]">
      <input
        className={`${field} w-56`}
        value={key}
        placeholder="new-page-key"
        disabled={isPending}
        onChange={(e) => { setKey(e.target.value); if (error) setError(null); }}
        aria-invalid={!!error}
        aria-describedby={error ? "add-page-error" : undefined}
      />
      <button
        type="button"
        onClick={add}
        disabled={isPending || !key.trim()}
        className="cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add a page"}
      </button>
      {error && <p id="add-page-error" role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}
    </div>
  );
}
