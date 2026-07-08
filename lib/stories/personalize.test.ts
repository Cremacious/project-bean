import { describe, it, expect } from "vitest";
import { personalize } from "./personalize";

describe("personalize", () => {
  it("replaces a single token", () => {
    expect(personalize("Hi {{name}}!", "Milo")).toBe("Hi Milo!");
  });
  it("replaces repeated tokens", () => {
    expect(personalize("{{name}} and {{name}}", "Ava")).toBe("Ava and Ava");
  });
  it("leaves text without a token unchanged", () => {
    expect(personalize("Once upon a time", "Milo")).toBe("Once upon a time");
  });
  it("is exact-match only (ignores spaced variants)", () => {
    expect(personalize("{{ name }}", "Milo")).toBe("{{ name }}");
  });
});
