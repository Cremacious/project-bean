import { describe, it, expect, afterEach, vi } from "vitest";
import { isAdmin } from "./admin";

afterEach(() => vi.unstubAllEnvs());

describe("isAdmin", () => {
  it("matches an allowlisted email, case-insensitively and trimmed", () => {
    vi.stubEnv("ADMIN_EMAILS", "chrismackall3@gmail.com, Second@Example.com");
    expect(isAdmin("chrismackall3@gmail.com")).toBe(true);
    expect(isAdmin("  SECOND@example.com ")).toBe(true);
  });
  it("rejects non-listed emails", () => {
    vi.stubEnv("ADMIN_EMAILS", "chrismackall3@gmail.com");
    expect(isAdmin("someone@else.com")).toBe(false);
  });
  it("returns false when the list is empty or unset", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin("chrismackall3@gmail.com")).toBe(false);
  });
});
