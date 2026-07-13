// lib/stories/covers.ts
// Shared source of truth for StoryCover motifs. Kept free of JSX so both server
// actions (validation) and React components (rendering) can import it safely.

/** The paper-cut scenes a story cover can use. Labels are dash-free (UI rule 1). */
export const MOTIFS = [
  { key: "ocean", label: "Ocean voyage" },
  { key: "night", label: "Starry night" },
  { key: "forest", label: "Deep forest" },
  { key: "space", label: "Outer space" },
  { key: "castle", label: "Castle hill" },
  { key: "meadow", label: "Sunny meadow" },
] as const;

export type MotifKey = (typeof MOTIFS)[number]["key"];

export const MOTIF_KEYS: readonly MotifKey[] = MOTIFS.map((m) => m.key);

export function isMotifKey(value: string | null | undefined): value is MotifKey {
  return !!value && (MOTIF_KEYS as readonly string[]).includes(value);
}

/** Stable non-negative hash of a string (same algorithm as the old cover). */
export function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * The motif a story renders with: an explicit, valid pin wins; otherwise a
 * motif is derived deterministically from the slug so every story gets a
 * distinct, stable cover with no setup.
 */
export function resolveMotif(slug: string, motif?: string | null): MotifKey {
  if (isMotifKey(motif)) return motif;
  return MOTIFS[hashSlug(slug) % MOTIFS.length].key;
}
