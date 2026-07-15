import { describe, it, expect } from "vitest";
import { validateStoryComplete, lintStoryContent } from "./validate-complete";
import type { StoryInput } from "../story-types";

const ok: StoryInput = {
  slug: "x", title: "Sleepy Sail", start: "a", ageBand: "2-4",
  pages: {
    a: { body: "Off they go, {{name}}.", choices: [{ label: "Turn the page", to: "b" }] },
    b: { body: "Which way?", choices: [{ label: "Warm", to: "c" }, { label: "Loop", to: "d" }] },
    c: { body: "Cozy and calm.", ending: "The Warm Cloud", endingKind: "good" },
    d: { body: "A giggly loop.", ending: "The Loop", endingKind: "game_over" },
  },
};

const msgs = (issues: { message: string }[]) => issues.map((i) => i.message).join(" ");

describe("validateStoryComplete", () => {
  it("passes a complete, clean story", () => {
    expect(validateStoryComplete(ok).blocking).toEqual([]);
  });
  it("blocks an empty body and tags it with the page key", () => {
    const s = structuredClone(ok); s.pages.a.body = "  ";
    const r = validateStoryComplete(s);
    expect(msgs(r.blocking)).toMatch(/needs text/i);
    expect(r.blocking.find((i) => /needs text/i.test(i.message))!.pageKey).toBe("a");
  });
  it("blocks a missing ending label", () => {
    const s = structuredClone(ok); s.pages.c.ending = "";
    expect(msgs(validateStoryComplete(s).blocking)).toMatch(/needs a label/i);
  });
  it("blocks an empty fork choice label", () => {
    const s = structuredClone(ok); s.pages.b.choices![0].label = "";
    expect(msgs(validateStoryComplete(s).blocking)).toMatch(/choice on .* needs a label/i);
  });
  it("blocks when no good ending is reachable", () => {
    const s = structuredClone(ok); s.pages.c.endingKind = "game_over";
    expect(msgs(validateStoryComplete(s).blocking)).toMatch(/good ending/i);
  });
  it("blocks a dash in any displayed copy", () => {
    const s = structuredClone(ok); s.pages.b.choices![0].label = "Stay up-late";
    expect(msgs(validateStoryComplete(s).blocking)).toMatch(/dash/i);
  });
});

describe("lintStoryContent", () => {
  it("warns on a possible child pronoun but does not block", () => {
    const s = structuredClone(ok); s.pages.a.body = "He climbed aboard.";
    const r = validateStoryComplete(s);
    expect(msgs(r.warnings)).toMatch(/stand in for the child/i);
    expect(msgs(r.blocking)).not.toMatch(/pronoun|stand in/i);
  });
  it("finds no dash issue in clean copy", () => {
    expect(lintStoryContent(ok).blocking).toEqual([]);
  });
});
