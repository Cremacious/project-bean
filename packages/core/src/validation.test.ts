import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidDisplayName,
  DISPLAY_NAME_MAX,
  isDeleteConfirmed,
  DELETE_CONFIRM_WORD,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts a normal address and trims surrounding space", () => {
    expect(isValidEmail("parent@example.com")).toBe(true);
    expect(isValidEmail("  parent@example.com  ")).toBe(true);
  });
  it("rejects addresses missing an @ or a dotted domain", () => {
    expect(isValidEmail("parent")).toBe(false);
    expect(isValidEmail("parent@localhost")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidDisplayName", () => {
  it("accepts a present name within the length cap", () => {
    expect(isValidDisplayName("Chris")).toBe(true);
    expect(isValidDisplayName("a".repeat(DISPLAY_NAME_MAX))).toBe(true);
  });
  it("rejects blank or whitespace-only names", () => {
    expect(isValidDisplayName("")).toBe(false);
    expect(isValidDisplayName("   ")).toBe(false);
  });
  it("rejects a name past the length cap", () => {
    expect(isValidDisplayName("a".repeat(DISPLAY_NAME_MAX + 1))).toBe(false);
  });
});

describe("isDeleteConfirmed", () => {
  it("accepts the exact confirmation word, ignoring surrounding space", () => {
    expect(isDeleteConfirmed(DELETE_CONFIRM_WORD)).toBe(true);
    expect(isDeleteConfirmed("  DELETE  ")).toBe(true);
  });
  it("rejects the wrong word or wrong case", () => {
    expect(isDeleteConfirmed("delete")).toBe(false);
    expect(isDeleteConfirmed("DELETE ACCOUNT")).toBe(false);
    expect(isDeleteConfirmed("")).toBe(false);
  });
});
