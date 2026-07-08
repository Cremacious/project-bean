// lib/reading-prefs.ts
export const READING_FONTS = [
  { id: "rounded", label: "Rounded", note: "Default", cssVar: "var(--font-nunito)" },
  { id: "hyperlegible", label: "Hyperlegible", note: "Extra clear", cssVar: "var(--font-atkinson)" },
  { id: "dyslexic", label: "OpenDyslexic", note: "Dyslexia-friendly", cssVar: "OpenDyslexic, sans-serif" },
] as const;

export const READING_SIZES = [
  { id: "sm", label: "Small", size: "1rem", lh: "1.55" },
  { id: "md", label: "Medium", size: "1.125rem", lh: "1.6" },
  { id: "lg", label: "Large", size: "1.375rem", lh: "1.62" },
  { id: "xl", label: "Huge", size: "1.625rem", lh: "1.6" },
] as const;

export type ReadingFontId = (typeof READING_FONTS)[number]["id"];
export type ReadingSizeId = (typeof READING_SIZES)[number]["id"];

export function isFontId(v: string): v is ReadingFontId { return READING_FONTS.some((f) => f.id === v); }
export function isSizeId(v: string): v is ReadingSizeId { return READING_SIZES.some((s) => s.id === v); }
export function fontCss(id: string) { return (READING_FONTS.find((f) => f.id === id) ?? READING_FONTS[0]).cssVar; }
export function sizeCss(id: string) { const s = READING_SIZES.find((x) => x.id === id) ?? READING_SIZES[1]; return { size: s.size, lh: s.lh }; }
