import { describe, expect, it } from "vitest";
import { FAQ_SECTIONS, allFaqItems } from "./faq";

/** Every string a parent could read on the Help page or in the app. */
function allCopy(): string[] {
  const out: string[] = [];
  for (const section of FAQ_SECTIONS) {
    out.push(section.title, section.summary);
    for (const item of section.items) {
      out.push(item.question, ...item.answer);
    }
  }
  return out;
}

describe("FAQ content", () => {
  it("has sections, each with at least one question", () => {
    expect(FAQ_SECTIONS.length).toBeGreaterThan(0);
    for (const section of FAQ_SECTIONS) {
      expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it("uses unique section ids and unique item ids", () => {
    const sectionIds = FAQ_SECTIONS.map((s) => s.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);

    const itemIds = allFaqItems().map((i) => i.id);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it("keeps every answer non-empty", () => {
    for (const item of allFaqItems()) {
      expect(item.answer.length).toBeGreaterThan(0);
      for (const paragraph of item.answer) {
        expect(paragraph.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // UI rule 1: no dashes as punctuation in displayed copy. Guard the shared
  // content so an edit cannot quietly reintroduce an em dash, en dash, or a
  // spaced hyphen used as a dash.
  it("contains no dash punctuation in any copy", () => {
    for (const copy of allCopy()) {
      expect(copy).not.toMatch(/[—–]/); // em dash, en dash
      expect(copy).not.toMatch(/ - /); // spaced hyphen used as a dash
    }
  });
});
