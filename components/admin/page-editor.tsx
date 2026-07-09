// components/admin/page-editor.tsx
"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePage, deletePage } from "@/lib/admin-actions";
import { field, labelCls } from "@/components/admin/styles";
import { FieldError } from "@/components/ui/field-error";
import { isValidSlug } from "@/lib/admin/slugs";
import { ChoicesEditor, type ChoiceRow } from "@/components/admin/choices-editor";

type EndingType = "good" | "game_over";

export function PageEditor({
  page, pageKeys, choices,
}: {
  page: { id: number; key: string; body: string; isEnding: boolean; endingLabel: string | null; endingType: string };
  pageKeys: string[];
  choices: ChoiceRow[];
}) {
  const router = useRouter();
  const [key, setKey] = useState(page.key);
  const [body, setBody] = useState(page.body);
  const [isEnding, setIsEnding] = useState(page.isEnding);
  const [endingType, setEndingType] = useState<EndingType>(page.endingType === "game_over" ? "game_over" : "good");
  const [endingLabel, setEndingLabel] = useState(page.endingLabel ?? "");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const otherPageKeys = pageKeys.filter((k) => k !== page.key);

  function insertName() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + "{{name}}" + body.slice(end);
    setSaved(false);
    setBody(next);
    // Restore focus + caret after the inserted token on the next tick.
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + "{{name}}".length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function save() {
    setError(null);
    setKeyError(null);
    setSaved(false);
    const cleanKey = key.trim();
    if (!cleanKey) {
      setKeyError("Please give this page a key.");
      return;
    }
    if (!isValidSlug(cleanKey)) {
      setKeyError("Use lowercase words joined by single hyphens, like forest-path.");
      return;
    }
    startTransition(async () => {
      const res = await updatePage(page.id, {
        key: cleanKey,
        body,
        isEnding,
        endingType,
        endingLabel: isEnding ? endingLabel : null,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        const message = res.error ?? "We could not save this page. Please try again.";
        if (/key/i.test(message)) setKeyError(message);
        else setError(message);
      }
    });
  }

  function remove() {
    if (!confirm(`Delete the page "${page.key}"? This also removes its choices.`)) return;
    startTransition(async () => {
      await deletePage(page.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[10rem] flex-1 space-y-1.5">
          <label htmlFor={`page-key-${page.id}`} className={labelCls}>Page key</label>
          <input
            id={`page-key-${page.id}`}
            className={field}
            value={key}
            disabled={isPending}
            onChange={(e) => { setKey(e.target.value); setSaved(false); if (keyError) setKeyError(null); }}
            aria-invalid={!!keyError}
            aria-describedby={keyError ? `page-key-${page.id}-error` : undefined}
          />
          <FieldError id={`page-key-${page.id}-error`}>{keyError}</FieldError>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="cursor-pointer rounded-2xl border border-[var(--pc-poppy-ink)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-poppy-ink)] shadow-[0_4px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete page
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Scene text</label>
          <button
            type="button"
            onClick={insertName}
            disabled={isPending}
            className="cursor-pointer rounded-xl border border-[var(--pc-line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert {"{{name}}"}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className={`${field} h-32 py-3 leading-relaxed`}
          style={{ height: "8rem" }}
          value={body}
          disabled={isPending}
          onChange={(e) => { setBody(e.target.value); setSaved(false); }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-pressed={isEnding}
          onClick={() => { setIsEnding((v) => !v); setSaved(false); }}
          disabled={isPending}
          className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${
            isEnding
              ? "bg-[var(--pc-plum)] text-white shadow-[0_4px_0_var(--pc-plum-ink)]"
              : "border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)]"
          }`}
        >
          {isEnding ? "This is an ending" : "Mark as an ending"}
        </button>
        {!isEnding && (
          <p className="text-xs text-[var(--pc-sub)]">Turning this into an ending will remove its choices when saved.</p>
        )}
      </div>

      {isEnding ? (
        <div className="space-y-3 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-cream,#fffaf0)] p-4">
          <div className="space-y-1.5">
            <p className={labelCls}>Ending type</p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={endingType === "good"}
                onClick={() => { setEndingType("good"); setSaved(false); }}
                disabled={isPending}
                className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${
                  endingType === "good"
                    ? "bg-[var(--pc-leaf-ink)] text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]"
                    : "border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)]"
                }`}
              >
                Good ending
              </button>
              <button
                type="button"
                aria-pressed={endingType === "game_over"}
                onClick={() => { setEndingType("game_over"); setSaved(false); }}
                disabled={isPending}
                className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${
                  endingType === "game_over"
                    ? "bg-[var(--pc-poppy-ink)] text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]"
                    : "border border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)]"
                }`}
              >
                Surprise ending
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Ending label</label>
            <input
              className={field}
              value={endingLabel}
              maxLength={80}
              placeholder="A happy ending"
              disabled={isPending}
              onChange={(e) => { setEndingLabel(e.target.value); setSaved(false); }}
            />
          </div>
        </div>
      ) : (
        <ChoicesEditor pageId={page.id} initialRows={choices} pageKeys={otherPageKeys} />
      )}

      {error && <p className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save page"}
        </button>
        {saved && !isPending && <span className="text-xs font-bold text-[var(--pc-leaf-ink)]">Saved</span>}
      </div>
    </div>
  );
}
