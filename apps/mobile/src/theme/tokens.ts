// apps/mobile/src/theme/tokens.ts
//
// The Paper Cut design tokens for the native app, ported literally from the
// web app's globals.css so both platforms render the same brand. Values are the
// real brand hex (see docs/WORKFLOW.md "Brand assets"), not indirected through
// CSS variables, because React Native has no cascade of custom properties.
//
// UI rule 3 (all text high contrast, WCAG AA): `ink` is the text color on every
// light surface and clears AA comfortably; `sub` is only used for secondary
// labels and small caps and still clears AA on white. There are deliberately no
// faint/low-opacity text tokens.

export const colors = {
  // Surfaces
  sky: "#EAF2FB", // app background
  card: "#FFFFFF",
  muted: "#DCEAFB",
  accent: "#F0EEFF",
  line: "#D4E3F2", // borders + inactive edges

  // Text
  ink: "#16283A", // primary text on light surfaces
  sub: "#5A7089", // secondary text (still AA on white/sky)
  onDark: "#FFFFFF", // text on plum / poppy fills
  cream: "#FFF1DC", // text/art on the deep navy night surface

  // Brights + their darker "ink" variants (used for solid button bottom edges).
  poppy: "#FF6B4A",
  poppyInk: "#E14A2B",
  leaf: "#2FB98A",
  leafInk: "#1E8F6A",
  sun: "#FFC24B",
  sunInk: "#D99A1C",
  plum: "#6C5CE7",
  plumInk: "#574BC0",

  // Focus ring (UI rule 2: every control shows a clear focus state).
  ring: "#6C5CE7",
} as const;

// 4pt spacing scale.
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

// The chunky "solid bottom edge" that marks something as tappable (UI rule 2).
export const EDGE = 5;
