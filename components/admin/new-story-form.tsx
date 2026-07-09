// components/admin/new-story-form.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStory } from "@/lib/admin-actions";
import { slugify, isValidSlug } from "@/lib/admin/slugs";
import { field, labelCls } from "@/components/admin/styles";
import { FieldError } from "@/components/ui/field-error";

const AGE_OPTIONS = [
  { value: "", label: "No age band" },
  { value: "2-4", label: "Ages 2 to 4" },
  { value: "5-7", label: "Ages 5 to 7" },
  { value: "8+", label: "Ages 8 and up" },
];

type Errors = { title?: string; slug?: string; form?: string };

export function NewStoryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isPending, startTransition] = useTransition();

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
    if (errors.title || errors.slug) setErrors((p) => ({ ...p, title: undefined, slug: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!title.trim()) next.title = "Please give the story a title.";
    if (!slug.trim()) next.slug = "Please add a slug for the web address.";
    else if (!isValidSlug(slug.trim())) next.slug = "Use lowercase words joined by single hyphens, like whispering-woods.";
    return next;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    startTransition(async () => {
      const res = await createStory({ title, slug, description, ageBand: ageBand || null, coverImageUrl: null });
      if (res.ok && res.slug) {
        router.push(`/admin/stories/${res.slug}`);
        return;
      }
      const message = res.error ?? "We could not create this draft. Please try again.";
      // Route the server message to the field it is about so the fix is obvious.
      if (/slug/i.test(message)) setErrors({ slug: message });
      else if (/title/i.test(message)) setErrors({ title: message });
      else setErrors({ form: message });
    });
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="t" className={labelCls}>Title</label>
        <input
          id="t"
          className={field}
          value={title}
          maxLength={80}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="The Whispering Woods"
          disabled={isPending}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "t-error" : undefined}
        />
        <FieldError id="t-error">{errors.title}</FieldError>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="s" className={labelCls}>Slug</label>
        <input
          id="s"
          className={field}
          value={slug}
          onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); if (errors.slug) setErrors((p) => ({ ...p, slug: undefined })); }}
          placeholder="whispering-woods"
          disabled={isPending}
          aria-invalid={!!errors.slug}
          aria-describedby={errors.slug ? "s-error" : "s-hint"}
        />
        {errors.slug ? (
          <FieldError id="s-error">{errors.slug}</FieldError>
        ) : (
          <p id="s-hint" className="text-xs text-[var(--pc-sub)]">Lowercase words joined by single hyphens. Used in the web address.</p>
        )}
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
      {errors.form && <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{errors.form}</p>}
      <button type="submit" disabled={isPending} className="cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
