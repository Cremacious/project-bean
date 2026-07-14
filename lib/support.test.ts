import { afterEach, describe, expect, it, vi } from "vitest";
import {
  validateSupportRequest,
  resolveSupportInbox,
  SUPPORT_MESSAGE_MAX,
} from "@/lib/support";

describe("validateSupportRequest", () => {
  it("accepts a valid submission and trims every field", () => {
    const result = validateSupportRequest({
      email: "  parent@example.com  ",
      message: "  My child cannot find the story.  ",
      name: "  Sam  ",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        email: "parent@example.com",
        message: "My child cannot find the story.",
        name: "Sam",
      },
    });
  });

  it("treats a missing name as an empty string", () => {
    const result = validateSupportRequest({ email: "a@b.co", message: "Hello there" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe("");
  });

  it("rejects an email that is not a valid shape", () => {
    const result = validateSupportRequest({ email: "not-an-email", message: "Hello" });
    expect(result).toMatchObject({ ok: false, field: "email" });
  });

  it("rejects an empty or whitespace only message", () => {
    const result = validateSupportRequest({ email: "a@b.co", message: "   " });
    expect(result).toMatchObject({ ok: false, field: "message" });
  });

  it("rejects a message longer than the cap", () => {
    const result = validateSupportRequest({
      email: "a@b.co",
      message: "x".repeat(SUPPORT_MESSAGE_MAX + 1),
    });
    expect(result).toMatchObject({ ok: false, field: "message" });
  });

  it("caps an overlong name rather than rejecting it", () => {
    const result = validateSupportRequest({
      email: "a@b.co",
      message: "Hello",
      name: "z".repeat(200),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name.length).toBe(60);
  });
});

describe("resolveSupportInbox", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns a valid SUPPORT_EMAIL when one is set", () => {
    expect(resolveSupportInbox({ SUPPORT_EMAIL: "help@bedtimequests.com" })).toBe(
      "help@bedtimequests.com",
    );
  });

  it("ignores a SUPPORT_EMAIL that is not a valid address", () => {
    // Falls through to the (still placeholder) published address, so null today.
    expect(resolveSupportInbox({ SUPPORT_EMAIL: "nonsense" })).toBeNull();
  });

  it("returns null when no inbox is configured (email is effectively disabled)", () => {
    expect(resolveSupportInbox({})).toBeNull();
  });
});
