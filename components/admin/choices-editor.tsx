// components/admin/choices-editor.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setChoices } from "@/lib/admin-actions";
import { field, labelCls } from "@/components/admin/styles";
import { FieldError } from "@/components/ui/field-error";

export type ChoiceRow = { label: string; toPageKey: string };

const btnBase =
  "cursor-pointer rounded-xl px-3 py-2 text-xs font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";
const iconBtn =
  "grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-[var(--pc-line)] bg-white text-sm font-extrabold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

/** Editor for one page's ordered outgoing choices. Save submits the FULL ordered list (setChoices replaces all rows). */
export function ChoicesEditor({
  pageId, initialRows, pageKeys,
}: {
  pageId: number;
  initialRows: ChoiceRow[];
  pageKeys: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ChoiceRow[]>(initialRows.length ? initialRows : [{ label: "", toPageKey: "" }]);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<ChoiceRow>) {
    setSaved(false);
    setError(null);
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setSaved(false);
    setRows((r) => [...r, { label: "", toPageKey: "" }]);
  }
  function removeRow(i: number) {
    setSaved(false);
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function moveUp(i: number) {
    if (i === 0) return;
    setSaved(false);
    setRows((r) => {
      const next = r.slice();
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }
  function moveDown(i: number) {
    setSaved(false);
    setRows((r) => {
      if (i === r.length - 1) return r;
      const next = r.slice();
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      return next;
    });
  }

  function save() {
    setSaved(false);
    // A row with a label but no destination (or the reverse) would be dropped silently.
    // Catch it here so the editor never loses half-finished work without saying so.
    const partial = rows.some((r) => {
      const hasLabel = r.label.trim().length > 0;
      const hasTarget = r.toPageKey.trim().length > 0;
      return hasLabel !== hasTarget;
    });
    if (partial) {
      setError("Each choice needs both text and a destination page. Please finish or remove the blank ones.");
      return;
    }
    setError(null);
    startTransition(async () => {
      await setChoices(pageId, rows);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-cream,#fffaf0)] p-4">
      <p className={labelCls}>Choices</p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              className={`${field} flex-1 min-w-[10rem]`}
              value={row.label}
              placeholder="Choice text"
              maxLength={120}
              disabled={isPending}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <select
              className={`${field} w-40`}
              value={row.toPageKey}
              disabled={isPending}
              onChange={(e) => update(i, { toPageKey: e.target.value })}
            >
              <option value="">Choose a page</option>
              {pageKeys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <button type="button" className={iconBtn} disabled={isPending || i === 0} onClick={() => moveUp(i)} aria-label="Move choice up">
              ↑
            </button>
            <button type="button" className={iconBtn} disabled={isPending || i === rows.length - 1} onClick={() => moveDown(i)} aria-label="Move choice down">
              ↓
            </button>
            <button type="button" className={iconBtn} disabled={isPending} onClick={() => removeRow(i)} aria-label="Remove choice">
              ✕
            </button>
          </div>
        ))}
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={addRow} disabled={isPending} className={`${btnBase} border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)]`}>
          Add choice
        </button>
        <button type="button" onClick={save} disabled={isPending} className={`${btnBase} bg-[var(--pc-plum)] text-white shadow-[0_3px_0_var(--pc-plum-ink)]`}>
          {isPending ? "Saving…" : "Save choices"}
        </button>
        {saved && !isPending && <span className="text-xs font-bold text-[var(--pc-leaf-ink)]">Saved</span>}
      </div>
    </div>
  );
}
