// lib/stories/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateStory } from "./validate";
import type { StoryInput } from "./story-types";

const base: StoryInput = {
  slug: "s",
  title: "S",
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

  it("flags a bad age band", () => {
    const errors = validateStory({ ...base, ageBand: "9-12" as StoryInput["ageBand"] });
    expect(errors).toContain('age band "9-12" is not one of 2-4, 5-7, 8+');
  });

  it("allows a good age band", () => {
    expect(validateStory({ ...base, ageBand: "5-7" })).toEqual([]);
  });

  it("allows a valid endingKind on an ending page", () => {
    const s: StoryInput = {
      ...base,
      pages: {
        a: { body: "start", choices: [{ label: "go", to: "b" }] },
        b: { body: "the end", ending: "The End", endingKind: "game_over" },
      },
    };
    expect(validateStory(s)).toEqual([]);
  });

  it("flags a bad endingKind on an ending page", () => {
    const s: StoryInput = {
      ...base,
      pages: {
        a: { body: "start", choices: [{ label: "go", to: "b" }] },
        b: { body: "the end", ending: "The End", endingKind: "bad" as StoryInput["pages"][string]["endingKind"] },
      },
    };
    expect(validateStory(s)).toContain('page "b" endingKind "bad" is not good or game_over');
  });
});
