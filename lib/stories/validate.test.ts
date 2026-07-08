// lib/stories/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateStory } from "./validate";
import type { StoryInput } from "@/content/stories/_story-types";

const base: StoryInput = {
  slug: "s",
  title: "S",
  readers: ["milo"],
  start: "a",
  pages: {
    a: { body: "start", choices: [{ label: "go", to: "b" }] },
    b: { body: "the end", ending: "The End" },
  },
};

describe("validateStory", () => {
  it("returns no errors for a valid story", () => {
    expect(validateStory(base)).toEqual([]);
  });

  it("flags a start key that does not exist", () => {
    const errors = validateStory({ ...base, start: "missing" });
    expect(errors).toContain('start page "missing" does not exist');
  });

  it("flags a choice pointing to a missing page", () => {
    const s: StoryInput = {
      ...base,
      pages: { a: { body: "x", choices: [{ label: "go", to: "nope" }] } },
    };
    expect(validateStory(s)).toContain('page "a" choice -> "nope" targets a missing page');
  });

  it("flags a non-ending page with no choices", () => {
    const s: StoryInput = { ...base, pages: { a: { body: "x" }, b: { body: "y", ending: "E" } }, start: "a" };
    expect(validateStory(s)).toContain('page "a" is not an ending but has no choices');
  });

  it("flags an ending page that also has choices", () => {
    const s: StoryInput = {
      ...base,
      pages: {
        a: { body: "x", choices: [{ label: "go", to: "b" }] },
        b: { body: "y", ending: "E", choices: [{ label: "again", to: "a" }] },
      },
    };
    expect(validateStory(s)).toContain('page "b" is an ending but has choices');
  });

  it("flags an empty readers list", () => {
    expect(validateStory({ ...base, readers: [] })).toContain("readers list is empty");
  });
});
