// components/admin/page-workspace.tsx
// The single-page editor used on /admin/stories/[slug]/pages/[key]. It edits one
// page's text, ending, and choices, then saves everything in one action and
// returns to the story graph. Replaces the old inline PagesPanel/PageEditor.
"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePage, setChoices, deletePage } from "@/lib/admin-actions";
import { isValidSlug } from "@bedtime-quests/core/admin/slugs";
import { choiceLabelHint } from "@bedtime-quests/core/stories/wizard/placeholders";
import { field, labelCls } from "@/components/admin/styles";
import { FieldError } from "@/components/ui/field-error";

type EndingType = "good" | "game_over";
type ChoiceRow = { label: string; toPageKey: string };

const iconBtn =
  "grid h-11 w-11 cursor-pointer place-items-center rounded-xl border border-[var(--pc-line)] bg-white text-sm font-extrabold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

type Incoming = { fromKey: string; label: string; fromBody: string };

export function PageWorkspace({
  slug, page, otherPageKeys, initialChoices, bodyHint, incoming = [],
}: {
  slug: string;
  page: { id: number; key: string; body: string; isEnding: boolean; endingLabel: string | null; endingType: string };
  otherPageKeys: string[];
  initialChoices: ChoiceRow[];
  bodyHint?: string;
  incoming?: Incoming[];
}) {
  const router = useRouter();
  const backHref = `/admin/stories/${slug}`;
  const [key, setKey] = useState(page.key);
  const [body, setBody] = useState(page.body);
  const [isEnding, setIsEnding] = useState(page.isEnding);
  const [endingType, setEndingType] = useState<EndingType>(page.endingType === "game_over" ? "game_over" : "good");
  const [endingLabel, setEndingLabel] = useState(page.endingLabel ?? "");
  const [rows, setRows] = useState<ChoiceRow[]>(initialChoices.length ? initialChoices : [{ label: "", toPageKey: "" }]);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertName() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + "{{name}}" + body.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + "{{name}}".length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function updateRow(i: number, patch: Partial<ChoiceRow>) {
    setError(null);
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  const addRow = () => setRows((r) => [...r, { label: "", toPageKey: "" }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  function move(i: number, dir: -1 | 1) {
    setRows((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const next = r.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    setError(null);
    setKeyError(null);
    const cleanKey = key.trim();
    if (!cleanKey) { setKeyError("Please give this page a key."); return; }
    if (!isValidSlug(cleanKey)) { setKeyError("Use lowercase words joined by single hyphens, like forest-path."); return; }
    if (!isEnding) {
      const partial = rows.some((r) => (r.label.trim().length > 0) !== (r.toPageKey.trim().length > 0));
      if (partial) { setError("Each choice needs both text and a destination page. Please finish or remove the blank ones."); return; }
    }
    startTransition(async () => {
      const res = await updatePage(page.id, { key: cleanKey, body, isEnding, endingType, endingLabel: isEnding ? endingLabel : null });
      if (!res.ok) {
        const message = res.error ?? "We could not save this page. Please try again.";
        if (/key/i.test(message)) setKeyError(message); else setError(message);
        return;
      }
      if (!isEnding) await setChoices(page.id, rows);
      router.push(backHref);
    });
  }

  function remove() {
    if (!confirm(`Delete the page "${page.key}"? This also removes its choices.`)) return;
    startTransition(async () => {
      await deletePage(page.id);
      router.push(backHref);
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-[var(--pc-line)] bg-white p-5 shadow-[0_4px_0_var(--pc-line)]">
      <div className="rounded-2xl border border-[#e2d6fb] bg-[#f6f2ff] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#6b3fd4]">How the reader got here</p>
        {incoming.length === 0 ? (
          <p className="mt-1 text-sm font-semibold text-[var(--pc-ink)]">This is the opening page. The story starts here.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {incoming.map((inc, i) => (
              <li key={i} className="text-sm text-[var(--pc-ink)]">
                From <b>{inc.fromKey}</b>, they tapped <b>&ldquo;{inc.label.trim() || "(no label yet)"}&rdquo;</b>.
                {inc.fromBody.trim() && (
                  <span className="mt-0.5 block text-xs italic text-[var(--pc-sub)]">
                    {inc.fromKey} said: &ldquo;{inc.fromBody.trim().length > 140 ? inc.fromBody.trim().slice(0, 140) + "…" : inc.fromBody.trim()}&rdquo;
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <label htmlFor="pw-key" className={labelCls}>Page key</label>
          <input id="pw-key" className={field} value={key} disabled={isPending}
            onChange={(e) => { setKey(e.target.value); if (keyError) setKeyError(null); }}
            aria-invalid={!!keyError} aria-describedby={keyError ? "pw-key-error" : undefined} />
          <FieldError id="pw-key-error">{keyError}</FieldError>
        </div>
        <button type="button" onClick={remove} disabled={isPending}
          className="cursor-pointer rounded-2xl border border-[var(--pc-poppy-ink)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-poppy-ink)] shadow-[0_4px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
          Delete page
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="pw-body" className={labelCls}>Scene text</label>
          <button type="button" onClick={insertName} disabled={isPending}
            className="cursor-pointer rounded-xl border border-[var(--pc-line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
            Insert {"{{name}}"}
          </button>
        </div>
        <textarea id="pw-body" ref={textareaRef} className={`${field} h-40 py-3 leading-relaxed`} style={{ height: "10rem" }}
          value={body} placeholder={bodyHint} disabled={isPending} onChange={(e) => setBody(e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button type="button" role="switch" aria-checked={isEnding} onClick={() => setIsEnding((v) => !v)} disabled={isPending}
          className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${isEnding ? "bg-[var(--pc-plum)] text-white shadow-[0_4px_0_var(--pc-plum-ink)]" : "border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)]"}`}>
          {isEnding ? "This is an ending" : "Mark as an ending"}
        </button>
        {!isEnding && <p className="text-xs text-[var(--pc-sub)]">Endings have no choices.</p>}
      </div>

      {isEnding ? (
        <div className="space-y-3 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-cream,#fffaf0)] p-4">
          <div className="space-y-1.5">
            <p id="pw-etype" className={labelCls}>Ending type</p>
            <div className="flex gap-2" role="group" aria-labelledby="pw-etype">
              {(["good", "game_over"] as EndingType[]).map((t) => (
                <button key={t} type="button" aria-pressed={endingType === t} onClick={() => setEndingType(t)} disabled={isPending}
                  className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${endingType === t ? (t === "good" ? "bg-[var(--pc-leaf-ink)] text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]" : "bg-[var(--pc-poppy-ink)] text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]") : "border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)]"}`}>
                  {t === "good" ? "Good ending" : "Surprise ending"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pw-elabel" className={labelCls}>Ending label</label>
            <input id="pw-elabel" className={field} value={endingLabel} maxLength={80} placeholder="A happy ending" disabled={isPending} onChange={(e) => setEndingLabel(e.target.value)} />
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-cream,#fffaf0)] p-4">
          <p className={labelCls}>Choices (each leads to a scene)</p>
          <div className="space-y-3">
            {rows.map((row, i) => (
              // Stack the label, destination, and controls on a phone; lay them
              // out in a row once there is width for it.
              <div key={i} className="flex flex-col gap-2 rounded-2xl border border-[var(--pc-line)] bg-white p-2.5 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
                <input className={`${field} sm:flex-1`} value={row.label} maxLength={120}
                  placeholder={choiceLabelHint(i % 2 === 0 ? "calm" : "curious")} disabled={isPending}
                  onChange={(e) => updateRow(i, { label: e.target.value })} aria-label={`Choice ${i + 1} text`} />
                <select className={`${field} sm:w-40`} value={row.toPageKey} disabled={isPending} onChange={(e) => updateRow(i, { toPageKey: e.target.value })} aria-label={`Choice ${i + 1} destination`}>
                  <option value="">Choose a page</option>
                  {otherPageKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button type="button" className={iconBtn} disabled={isPending || i === 0} onClick={() => move(i, -1)} aria-label="Move choice up">↑</button>
                  <button type="button" className={iconBtn} disabled={isPending || i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move choice down">↓</button>
                  <button type="button" className={iconBtn} disabled={isPending} onClick={() => removeRow(i)} aria-label="Remove choice">✕</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} disabled={isPending}
            className="cursor-pointer rounded-xl border border-[var(--pc-line)] bg-white px-3 py-2 text-xs font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50">
            Add choice
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={isPending}
          className="cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Saving…" : "Save and back to graph"}
        </button>
      </div>
    </div>
  );
}
