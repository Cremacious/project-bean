import { describe, it, expect } from "vitest";
import { placeholderFor, choiceLabelHint } from "./placeholders";

// hyphen-minus, general-punctuation dashes (U+2010..U+2015), and the minus sign.
const DASH = /[-‐-―−]/;

describe("placeholderFor", () => {
  it("returns a role-appropriate hint for an opening scene", () => {
    expect(placeholderFor("opening", "2-4", 0)).toMatch(/\{\{name\}\}/);
  });
  it("is deterministic for the same inputs", () => {
    expect(placeholderFor("scene", "5-7", 2)).toBe(placeholderFor("scene", "5-7", 2));
  });
  it("never contains a dash in any hint", () => {
    const roles = ["opening", "scene", "pre_choice_scene", "choice_prompt", "good_ending", "surprise_ending"] as const;
    for (const r of roles)
      for (const b of ["2-4", "5-7", "8+", null] as const)
        expect(placeholderFor(r, b, 1)).not.toMatch(DASH);
  });
  it("differs by branch flavor for choice labels", () => {
    expect(choiceLabelHint("calm")).not.toBe(choiceLabelHint("curious"));
  });
});
