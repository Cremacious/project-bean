// components/story/reading-settings.tsx
"use client";

import { useEffect } from "react";
import { READING_FONTS, READING_SIZES, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

// Font-family utility per option, used on the little "Bean" preview word.
const SAMPLE_CLASS: Record<ReadingFontId, string> = {
  rounded: "font-[family-name:var(--font-nunito)]",
  hyperlegible: "font-[family-name:var(--font-atkinson)]",
  dyslexic: "[font-family:OpenDyslexic,sans-serif]",
};

// Preview "A" grows with each size step so the choice reads at a glance.
const SIZE_PREVIEW = ["text-base", "text-xl", "text-2xl", "text-3xl"];

export function ReadingSettings({
  open,
  onClose,
  font,
  size,
  onFont,
  onSize,
}: {
  open: boolean;
  onClose: () => void;
  font: ReadingFontId;
  size: ReadingSizeId;
  onFont: (f: ReadingFontId) => void;
  onSize: (s: ReadingSizeId) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Click catcher. Dark scrim on mobile (bottom sheet); invisible on desktop (popover). */}
      <div
        className="fixed inset-0 z-40 bg-[rgba(22,40,58,0.32)] sm:bg-transparent"
        onClick={onClose}
      />

      {/* Panel: bottom sheet on mobile, popover anchored top-right on desktop. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reading settings"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-20px_rgba(22,40,58,0.5)]
                   sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-16 sm:max-h-none sm:w-80 sm:rounded-3xl sm:p-5 sm:shadow-[0_18px_50px_-16px_rgba(22,40,58,0.5)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--pc-line)] sm:hidden" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[var(--pc-ink)]">Reading settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reading settings"
            className="-mr-2 grid h-11 w-11 cursor-pointer place-items-center rounded-full text-xl leading-none text-[var(--pc-sub)] outline-none transition-colors hover:bg-[var(--muted)] hover:text-[var(--pc-ink)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            ×
          </button>
        </div>

        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--pc-sub)]">Text size</p>
        <div className="flex gap-2">
          {READING_SIZES.map((s, i) => {
            const selected = size === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSize(s.id)}
                aria-pressed={selected}
                aria-label={`${s.label} text`}
                className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 py-3 font-display font-bold leading-none outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 ${
                  selected
                    ? "border-[var(--pc-plum)] bg-[var(--accent)] text-[var(--pc-plum-ink)] shadow-[0_4px_0_var(--pc-plum)]"
                    : "border-[var(--pc-line)] text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)]"
                }`}
              >
                <span className={SIZE_PREVIEW[i]}>A</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide">{s.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mb-2 mt-5 text-xs font-extrabold uppercase tracking-wider text-[var(--pc-sub)]">Reading font</p>
        <div className="flex flex-col gap-2">
          {READING_FONTS.map((f) => {
            const selected = font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFont(f.id)}
                aria-pressed={selected}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 text-left outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 ${
                  selected
                    ? "border-[var(--pc-plum)] bg-[var(--accent)] shadow-[0_4px_0_var(--pc-plum)]"
                    : "border-[var(--pc-line)] shadow-[0_4px_0_var(--pc-line)]"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-bold text-[var(--pc-ink)]">{f.label}</span>
                  <span className="block text-xs text-[var(--pc-sub)]">{f.note}</span>
                </span>
                <span className={`text-lg text-[var(--pc-ink)] ${SAMPLE_CLASS[f.id]}`}>Bean</span>
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-full text-sm leading-none text-white ${
                    selected ? "bg-[var(--pc-plum)]" : "border-2 border-[var(--pc-line)]"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full cursor-pointer rounded-2xl bg-[var(--pc-plum)] py-3.5 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
        >
          Done
        </button>
      </div>
    </>
  );
}
