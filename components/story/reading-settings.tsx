// components/story/reading-settings.tsx
"use client";

import { useEffect } from "react";
import { READING_FONTS, READING_SIZES, type ReadingFontId, type ReadingSizeId } from "@/lib/reading-prefs";

const SAMPLE_CLASS: Record<ReadingFontId, string> = {
  rounded: "font-[family-name:var(--font-nunito)]",
  hyperlegible: "font-[family-name:var(--font-atkinson)]",
  dyslexic: "[font-family:OpenDyslexic,sans-serif]",
};

export function ReadingSettings({
  open, onOpenChange, font, size, onFont, onSize,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  font: ReadingFontId;
  size: ReadingSizeId;
  onFont: (f: ReadingFontId) => void;
  onSize: (s: ReadingSizeId) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  const sizeScale = ["text-xs", "text-base", "text-xl", "text-2xl"];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(22,40,58,0.32)]" onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-label="Reading settings"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-5 shadow-[0_-18px_40px_-20px_rgba(22,40,58,0.5)]
                   sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:w-72 sm:rounded-3xl sm:shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--pc-line)] sm:hidden" />
        <h4 className="font-display text-lg font-bold">Reading settings</h4>

        <p className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wider text-[var(--pc-sub)]">Text size</p>
        <div className="flex gap-2">
          {READING_SIZES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSize(s.id)}
              aria-pressed={size === s.id}
              className={`flex-1 rounded-xl border py-2.5 font-display font-bold outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${sizeScale[i]} ${
                size === s.id ? "border-[var(--pc-plum)] bg-[var(--accent)] text-[var(--pc-plum-ink)]" : "border-[var(--pc-line)] text-[var(--pc-ink)]"
              }`}
            >
              A
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-extrabold uppercase tracking-wider text-[var(--pc-sub)]">Reading font</p>
        <div className="flex flex-col gap-2">
          {READING_FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFont(f.id)}
              aria-pressed={font === f.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                font === f.id ? "border-[var(--pc-plum)] bg-[var(--accent)]" : "border-[var(--pc-line)]"
              }`}
            >
              <span className="flex-1">
                <span className="block font-display text-sm font-bold">{f.label}</span>
                <span className="block text-xs text-[var(--pc-sub)]">{f.note}</span>
              </span>
              <span className={`text-lg text-[var(--pc-ink)] ${SAMPLE_CLASS[f.id]}`}>Bean</span>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-xs text-white ${font === f.id ? "bg-[var(--pc-plum)]" : "border-2 border-[var(--pc-line)]"}`}>
                {font === f.id ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="mt-5 w-full rounded-2xl bg-[var(--pc-plum)] py-3.5 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Done
        </button>
      </div>
    </>
  );
}
