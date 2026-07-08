import { describe, it, expect } from "vitest";
import { isValidSlug, slugify } from "./slugs";

describe("isValidSlug", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    expect(isValidSlug("whispering-woods")).toBe(true);
    expect(isValidSlug("bean")).toBe(true);
  });
  it("rejects spaces, caps, leading/trailing/double hyphens, empty", () => {
    for (const bad of ["", "Bean", "two words", "-bean", "bean-", "a--b", "bean!"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });
});

describe("slugify", () => {
  it("turns a title into a valid slug", () => {
    expect(slugify("The Whispering Woods!")).toBe("the-whispering-woods");
    expect(slugify("  Bean & Friends  ")).toBe("bean-friends");
  });
});
