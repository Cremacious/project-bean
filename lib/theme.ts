// lib/theme.ts
export const THEMES = [
  { id: "cozy", label: "Cozy" },
  { id: "playful", label: "Playful" },
  { id: "calm", label: "Calm" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
