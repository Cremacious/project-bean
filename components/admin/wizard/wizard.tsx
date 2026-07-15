// components/admin/wizard/wizard.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { slugify, isValidSlug } from "@bedtime-quests/core/admin/slugs";
import { suggestEndingCounts, minChoicesToGoodEnding } from "@bedtime-quests/core/stories/wizard/endings";
import { TEMPLATES } from "@bedtime-quests/core/stories/wizard/templates";
import type { TemplateId, AgeBandOrNone } from "@bedtime-quests/core/stories/wizard/types";
import { generateFromTemplate } from "@/lib/admin/wizard-actions";
import { field, labelCls } from "@/components/admin/styles";
import { FieldError } from "@/components/ui/field-error";
import { TemplateShape } from "@/components/admin/wizard/template-shape";

const AGE_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "2-4", label: "Ages 2 to 4", hint: "Toddlers, the shortest, simplest stories" },
  { value: "5-7", label: "Ages 5 to 7", hint: "Early readers, a little more adventure" },
  { value: "8+", label: "Ages 8 and up", hint: "Confident readers, a fuller journey" },
  { value: "", label: "No age band", hint: "Fits any age" },
];

const clickyCard =
  "cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5";
const primaryBtn =
  "cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";
const ghostBtn =
  "cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white px-5 py-3 text-base font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ageBand, setAgeBand] = useState<string>("2-4");
  const [good, setGood] = useState(2);
  const [surprise, setSurprise] = useState(1);
  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const band = (ageBand || null) as AgeBandOrNone;
  const suggestion = suggestEndingCounts(band);
  const minChoices = minChoicesToGoodEnding(band);

  function pickAge(value: string) {
    setAgeBand(value);
    const s = suggestEndingCounts((value || null) as AgeBandOrNone);
    setGood(s.good);
    setSurprise(s.surprise);
  }

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
    if (slugError) setSlugError(null);
  }

  function clamp(v: number, [lo, hi]: [number, number]) {
    return Math.max(lo, Math.min(hi, v));
  }

  function create() {
    setFormError(null);
    setSlugError(null);
    if (!title.trim()) { setFormError("Please give the story a title."); return; }
    if (!isValidSlug(slug.trim())) { setSlugError("Use lowercase words joined by single hyphens, like whispering-woods."); return; }
    startTransition(async () => {
      // Blank runs through the same generator: expandTemplate("blank") yields a
      // single opening page and a start pointer, so a freeform story is still a
      // real, growable draft rather than an empty shell.
      const res = await generateFromTemplate({ title, slug, description: "", ageBand: ageBand || null, templateId: templateId!, good, surprise });
      if (res.ok && res.slug) { router.push(`/admin/stories/${res.slug}`); return; }
      const message = res.error ?? "We could not create this story. Please try again.";
      if (/slug/i.test(message)) setSlugError(message);
      else setFormError(message);
    });
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-xs font-bold" aria-label="Wizard steps">
        {["Age group", "Endings", "Template", "Name it"].map((name, i) => (
          <li key={name} className={`rounded-full px-3 py-1.5 ${step === i + 1 ? "bg-[var(--pc-plum)] text-white" : step > i + 1 ? "bg-[#E6F7F0] text-[var(--pc-leaf-ink)]" : "bg-[var(--pc-line)] text-[var(--pc-ink)]"}`}>
            {i + 1}. {name}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Who is this story for?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {AGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => pickAge(o.value)}
                className={`${clickyCard} ${ageBand === o.value ? "border-[var(--pc-plum)] ring-2 ring-[var(--pc-plum)]" : "border-[var(--pc-line)]"}`}
                aria-pressed={ageBand === o.value}
              >
                <span className="block font-display text-base font-extrabold">{o.label}</span>
                <span className="mt-1 block text-sm text-[var(--pc-sub)]">{o.hint}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button type="button" className={primaryBtn} onClick={() => setStep(2)}>Next</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">How many endings?</h2>
          <p className="text-sm text-[var(--pc-sub)]">Each good ending will take at least {minChoices} choices to reach. Surprise endings are gentle early exits. You can change these later.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Counter label="Good endings" value={good} onChange={(v) => setGood(clamp(v, suggestion.goodRange))} range={suggestion.goodRange} accent="var(--pc-leaf-ink)" />
            <Counter label="Surprise endings" value={surprise} onChange={(v) => setSurprise(clamp(v, suggestion.surpriseRange))} range={suggestion.surpriseRange} accent="#9a6b00" />
          </div>
          <div className="flex justify-between">
            <button type="button" className={ghostBtn} onClick={() => setStep(1)}>Back</button>
            <button type="button" className={primaryBtn} onClick={() => setStep(3)}>Next</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Pick a shape</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...TEMPLATES, { id: "blank" as TemplateId, name: "Blank", description: "Start with one page and build it your own way.", ageBands: [] as AgeBandOrNone[] }].map((t) => {
              const recommended = t.ageBands.includes(band);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`${clickyCard} ${templateId === t.id ? "border-[var(--pc-plum)] ring-2 ring-[var(--pc-plum)]" : "border-[var(--pc-line)]"}`}
                  aria-pressed={templateId === t.id}
                >
                  <div className="mb-2 h-24 overflow-hidden rounded-xl border border-[var(--pc-line)] bg-[#fbfdff] p-1">
                    <TemplateShape id={t.id} />
                  </div>
                  <span className="flex items-center gap-2">
                    <span className="font-display text-base font-extrabold">{t.name}</span>
                    {recommended && <span className="rounded-full bg-[#E6F7F0] px-2 py-0.5 text-[10px] font-extrabold text-[var(--pc-leaf-ink)]">Recommended</span>}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--pc-sub)]">{t.description}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button type="button" className={ghostBtn} onClick={() => setStep(2)}>Back</button>
            <button type="button" className={primaryBtn} disabled={!templateId} onClick={() => setStep(4)}>Next</button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Name your story</h2>
          <div className="max-w-lg space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="wz-title" className={labelCls}>Title</label>
              <input id="wz-title" className={field} value={title} maxLength={80} placeholder="The Whispering Woods" disabled={isPending} onChange={(e) => onTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="wz-slug" className={labelCls}>Slug</label>
              <input id="wz-slug" className={field} value={slug} placeholder="whispering-woods" disabled={isPending}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); if (slugError) setSlugError(null); }}
                aria-invalid={!!slugError} aria-describedby={slugError ? "wz-slug-error" : "wz-slug-hint"} />
              {slugError ? <FieldError id="wz-slug-error">{slugError}</FieldError>
                : <p id="wz-slug-hint" className="text-xs text-[var(--pc-sub)]">Lowercase words joined by single hyphens. Used in the web address.</p>}
            </div>
            {formError && <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{formError}</p>}
          </div>
          <div className="flex justify-between">
            <button type="button" className={ghostBtn} disabled={isPending} onClick={() => setStep(3)}>Back</button>
            <button type="button" className={primaryBtn} disabled={isPending} onClick={create}>
              {isPending ? "Creating…" : "Create story"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Counter({ label, value, onChange, range, accent }: { label: string; value: number; onChange: (v: number) => void; range: [number, number]; accent: string }) {
  const btn = "grid h-11 w-11 cursor-pointer place-items-center rounded-2xl border border-[var(--pc-line)] bg-white text-xl font-extrabold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
      <p className={labelCls}>{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= range[0]} aria-label={`Fewer ${label}`}>−</button>
        <span className="min-w-[2ch] text-center font-display text-3xl font-extrabold" style={{ color: accent }}>{value}</span>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= range[1]} aria-label={`More ${label}`}>+</button>
        <span className="ml-auto text-xs font-bold text-[var(--pc-sub)]">pick {range[0]} to {range[1]}</span>
      </div>
    </div>
  );
}
