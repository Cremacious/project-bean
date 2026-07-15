import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidDisplayName,
  DISPLAY_NAME_MAX,
  isDeleteConfirmed,
  DELETE_CONFIRM_WORD,
  passwordStrength,
  passwordsMatch,
  PASSWORD_MIN,
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

describe("passwordStrength", () => {
  it("does not grade anything shorter than the minimum length", () => {
    expect(passwordStrength("")).toEqual({ score: 0, label: "Too short" });
    expect(passwordStrength("a".repeat(PASSWORD_MIN - 1))).toEqual({ score: 0, label: "Too short" });
  });
  it("grades a bare minimum single-class password as weak", () => {
    expect(passwordStrength("a".repeat(PASSWORD_MIN))).toEqual({ score: 1, label: "Weak" });
  });
  it("climbs with character variety and length", () => {
    expect(passwordStrength("abcdefgH").score).toBe(2); // two classes at min length
    expect(passwordStrength("abcdefgH9").score).toBe(3); // three classes
    expect(passwordStrength("abcdefgH9!longer").label).toBe("Strong"); // four classes + length
  });
});

describe("passwordsMatch", () => {
  it("is true only when both are non-empty and identical", () => {
    expect(passwordsMatch("hunter2!", "hunter2!")).toBe(true);
  });
  it("is false when they differ or either is empty", () => {
    expect(passwordsMatch("hunter2!", "hunter2")).toBe(false);
    expect(passwordsMatch("", "")).toBe(false);
    expect(passwordsMatch("hunter2!", "")).toBe(false);
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
