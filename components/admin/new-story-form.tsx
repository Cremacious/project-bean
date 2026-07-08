// components/admin/new-story-form.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStory } from "@/lib/admin-actions";
import { slugify } from "@/lib/admin/slugs";
import { field, labelCls } from "@/components/admin/styles";

const AGE_OPTIONS = [
  { value: "", label: "No age band" },
  { value: "2-4", label: "Ages 2 to 4" },
  { value: "5-7", label: "Ages 5 to 7" },
  { value: "8+", label: "Ages 8 and up" },
];

export function NewStoryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createStory({ title, slug, description, ageBand: ageBand || null, coverImageUrl: null });
      if (res.ok && res.slug) router.push(`/admin/stories/${res.slug}`);
      else setError(res.error ?? "Something went wrong");
    });
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="t" className={labelCls}>Title</label>
        <input id="t" className={field} value={title} maxLength={80} onChange={(e) => onTitle(e.target.value)} placeholder="The Whispering Woods" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="s" className={labelCls}>Slug</label>
        <input id="s" className={field} value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} placeholder="whispering-woods" disabled={isPending} />
        <p className="text-xs text-[var(--pc-sub)]">Lowercase words joined by single hyphens. Used in the web address.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="d" className={labelCls}>Description</label>
        <input id="d" className={field} value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} placeholder="A short, cozy summary" disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="a" className={labelCls}>Age band</label>
        <select id="a" className={field} value={ageBand} onChange={(e) => setAgeBand(e.target.value)} disabled={isPending}>
          {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {error && <p className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}
      <button type="submit" disabled={isPending} className="rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:opacity-60">
        {isPending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
