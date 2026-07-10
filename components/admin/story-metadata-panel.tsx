// components/admin/story-metadata-panel.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStoryMeta, setStartPage, deleteStory } from "@/lib/admin-actions";
import { field, labelCls } from "@/components/admin/styles";
import { FieldError } from "@/components/ui/field-error";
import { isValidHttpUrl } from "@/lib/validation";
import { StoryCover } from "@/components/story/story-cover";
import { MOTIFS } from "@/lib/stories/covers";

const AGE_OPTIONS = [
  { value: "", label: "No age band" },
  { value: "2-4", label: "Ages 2 to 4" },
  { value: "5-7", label: "Ages 5 to 7" },
  { value: "8+", label: "Ages 8 and up" },
];

type Errors = { title?: string; cover?: string; form?: string };

export function StoryMetadataPanel({
  story, pageKeys, startKey, slug,
}: {
  story: { id: number; title: string; description: string; ageBand: string | null; coverImageUrl: string | null; coverMotif: string | null };
  pageKeys: string[];
  startKey: string | null;
  slug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);
  const [ageBand, setAgeBand] = useState(story.ageBand ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(story.coverImageUrl ?? "");
  const [coverMotif, setCoverMotif] = useState(story.coverMotif ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [startPending, startStartTransition] = useTransition();

  function validate(): Errors {
    const next: Errors = {};
    if (!title.trim()) next.title = "Please give the story a title.";
    if (coverImageUrl.trim() && !isValidHttpUrl(coverImageUrl)) next.cover = "Please use a full web address that starts with http or https.";
    return next;
  }

  function save() {
    setErrors({});
    setSaved(false);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    startTransition(async () => {
      const res = await updateStoryMeta(story.id, {
        title, description, ageBand: ageBand || null, coverImageUrl: coverImageUrl.trim() || null, coverMotif: coverMotif || null,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        const message = res.error ?? "We could not save these details. Please try again.";
        if (/title/i.test(message)) setErrors({ title: message });
        else setErrors({ form: message });
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
          <input
            id="m-title"
            className={field}
            value={title}
            maxLength={80}
            disabled={isPending}
            onChange={(e) => { setTitle(e.target.value); setSaved(false); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "m-title-error" : undefined}
          />
          <FieldError id="m-title-error">{errors.title}</FieldError>
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
          <label htmlFor="m-motif" className={labelCls}>Cover art</label>
          <div className="flex items-center gap-3">
            <StoryCover
              slug={slug}
              motif={coverMotif || null}
              imageUrl={coverImageUrl.trim() || null}
              className="h-16 w-16 flex-none rounded-xl border border-[var(--pc-line)]"
            />
            <select
              id="m-motif"
              className={field}
              value={coverMotif}
              disabled={isPending}
              onChange={(e) => { setCoverMotif(e.target.value); setSaved(false); }}
            >
              <option value="">Auto from title</option>
              {MOTIFS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[var(--pc-sub)]">
            Pick a scene, or leave on Auto to generate one. A cover image address below, when set, replaces the scene.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-cover" className={labelCls}>Cover image address</label>
          <input
            id="m-cover"
            className={field}
            value={coverImageUrl}
            placeholder="https://…"
            disabled={isPending}
            onChange={(e) => { setCoverImageUrl(e.target.value); setSaved(false); if (errors.cover) setErrors((p) => ({ ...p, cover: undefined })); }}
            aria-invalid={!!errors.cover}
            aria-describedby={errors.cover ? "m-cover-error" : undefined}
          />
          <FieldError id="m-cover-error">{errors.cover}</FieldError>
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

        {errors.form && <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{errors.form}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save details"}
          </button>
          {saved && !isPending && <span className="text-xs font-bold text-[var(--pc-leaf-ink)]">Saved</span>}
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="ml-auto cursor-pointer rounded-2xl border border-[var(--pc-poppy-ink)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-poppy-ink)] shadow-[0_4px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete story
          </button>
        </div>
      </div>
    </section>
  );
}
