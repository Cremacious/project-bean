// components/admin/story-metadata-panel.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoryMeta, setStartPage, deleteStory } from "@/lib/admin-actions";
import { field, labelCls } from "@/components/admin/styles";

const AGE_OPTIONS = [
  { value: "", label: "No age band" },
  { value: "2-4", label: "Ages 2 to 4" },
  { value: "5-7", label: "Ages 5 to 7" },
  { value: "8+", label: "Ages 8 and up" },
];

export function StoryMetadataPanel({
  story, pageKeys, startKey,
}: {
  story: { id: number; title: string; description: string; ageBand: string | null; coverImageUrl: string | null };
  pageKeys: string[];
  startKey: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);
  const [ageBand, setAgeBand] = useState(story.ageBand ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(story.coverImageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [startPending, startStartTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateStoryMeta(story.id, {
        title, description, ageBand: ageBand || null, coverImageUrl: coverImageUrl.trim() || null,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  function onStartPage(key: string) {
    startStartTransition(async () => {
      await setStartPage(story.id, key);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete "${story.title}" and all of its pages? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteStory(story.id);
      router.push("/admin");
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
      <h2 className="font-display text-xl font-extrabold">Story details</h2>

      <div className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="m-title" className={labelCls}>Title</label>
          <input id="m-title" className={field} value={title} maxLength={80} disabled={isPending} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-desc" className={labelCls}>Description</label>
          <input id="m-desc" className={field} value={description} maxLength={200} disabled={isPending} onChange={(e) => { setDescription(e.target.value); setSaved(false); }} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-age" className={labelCls}>Age band</label>
          <select id="m-age" className={field} value={ageBand} disabled={isPending} onChange={(e) => { setAgeBand(e.target.value); setSaved(false); }}>
            {AGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-cover" className={labelCls}>Cover image address</label>
          <input id="m-cover" className={field} value={coverImageUrl} placeholder="https://…" disabled={isPending} onChange={(e) => { setCoverImageUrl(e.target.value); setSaved(false); }} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-start" className={labelCls}>Start page</label>
          <select
            id="m-start"
            className={field}
            value={startKey ?? ""}
            disabled={startPending || pageKeys.length === 0}
            onChange={(e) => onStartPage(e.target.value)}
          >
            <option value="" disabled>Choose a start page</option>
            {pageKeys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-2xl bg-[var(--pc-plum)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save details"}
          </button>
          {saved && !isPending && <span className="text-xs font-bold text-[var(--pc-leaf-ink)]">Saved</span>}
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="ml-auto rounded-2xl border border-[var(--pc-poppy-ink)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-poppy-ink)] shadow-[0_4px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-50"
          >
            Delete story
          </button>
        </div>
      </div>
    </section>
  );
}
