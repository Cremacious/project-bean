import { describe, it, expect } from "vitest";
import { resolveMotif, isMotifKey, MOTIF_KEYS, MOTIFS } from "./covers";

describe("resolveMotif", () => {
  it("honors a valid pinned motif regardless of slug", () => {
    expect(resolveMotif("whispering-woods", "space")).toBe("space");
  });

  it("falls back to a slug-derived motif when no pin is given", () => {
    const a = resolveMotif("whispering-woods", null);
    const b = resolveMotif("whispering-woods", "");
    const c = resolveMotif("whispering-woods", undefined);
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(MOTIF_KEYS).toContain(a);
  });

  it("is deterministic across calls", () => {
    expect(resolveMotif("deep-sea")).toBe(resolveMotif("deep-sea"));
  });

  it("distinguishes different slugs (not all the same motif)", () => {
    const seen = new Set(MOTIFS.map((m) => resolveMotif(`story-${m.key}-seed`)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("ignores an unknown motif and derives from the slug instead", () => {
    expect(resolveMotif("deep-sea", "not-a-real-motif")).toBe(resolveMotif("deep-sea"));
  });
});

describe("isMotifKey", () => {
  it("accepts known keys and rejects everything else", () => {
    expect(isMotifKey("ocean")).toBe(true);
    expect(isMotifKey("nope")).toBe(false);
    expect(isMotifKey("")).toBe(false);
    expect(isMotifKey(null)).toBe(false);
    expect(isMotifKey(undefined)).toBe(false);
  });
});
