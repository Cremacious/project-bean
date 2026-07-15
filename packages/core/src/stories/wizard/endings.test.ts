import { describe, it, expect } from "vitest";
import { suggestEndingCounts, minChoicesToGoodEnding } from "./endings";

describe("suggestEndingCounts", () => {
  it("suggests 2 good / 1 surprise for ages 2 to 4", () => {
    expect(suggestEndingCounts("2-4")).toEqual({
      good: 2, surprise: 1, goodRange: [2, 3], surpriseRange: [0, 2],
    });
  });
  it("suggests 3 good / 2 surprise for ages 8 up", () => {
    const s = suggestEndingCounts("8+");
    expect(s.good).toBe(3);
    expect(s.surprise).toBe(2);
    expect(s.goodRange).toEqual([3, 4]);
  });
  it("defaults to 3 good / 1 surprise for no age band", () => {
    expect(suggestEndingCounts(null).good).toBe(3);
    expect(suggestEndingCounts(null).surprise).toBe(1);
  });
  it("never suggests fewer than one good ending", () => {
    for (const band of ["2-4", "5-7", "8+", null] as const) {
      expect(suggestEndingCounts(band).goodRange[0]).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("minChoicesToGoodEnding", () => {
  it("is 3 / 5 / 7 by band and 5 for no band", () => {
    expect(minChoicesToGoodEnding("2-4")).toBe(3);
    expect(minChoicesToGoodEnding("5-7")).toBe(5);
    expect(minChoicesToGoodEnding("8+")).toBe(7);
    expect(minChoicesToGoodEnding(null)).toBe(5);
  });
});
