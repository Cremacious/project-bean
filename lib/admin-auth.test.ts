import { describe, it, expect, afterEach, vi } from "vitest";
import {
  constantTimeEqual,
  verifyAdminCredentials,
  signAdminToken,
  verifyAdminToken,
} from "./admin-auth";

afterEach(() => vi.unstubAllEnvs());

const NOW = 1_700_000_000; // fixed unix seconds for token tests

describe("constantTimeEqual", () => {
  it("is true only for identical strings", () => {
    expect(constantTimeEqual("hunter2", "hunter2")).toBe(true);
    expect(constantTimeEqual("hunter2", "hunter3")).toBe(false);
  });
  it("is false for differing lengths without throwing", () => {
    expect(constantTimeEqual("short", "muchlonger")).toBe(false);
    expect(constantTimeEqual("", "x")).toBe(false);
  });
});

describe("verifyAdminCredentials", () => {
  it("requires BOTH an allowlisted email AND the exact password", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("ADMIN_PASSWORD", "correct horse battery staple");
    expect(verifyAdminCredentials("admin@example.com", "correct horse battery staple")).toBe(true);
    // right password, wrong (non-allowlisted) email
    expect(verifyAdminCredentials("intruder@example.com", "correct horse battery staple")).toBe(false);
    // allowlisted email, wrong password
    expect(verifyAdminCredentials("admin@example.com", "guess")).toBe(false);
  });

  it("matches the email case-insensitively and trimmed (via isAdmin)", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("ADMIN_PASSWORD", "pw");
    expect(verifyAdminCredentials("  ADMIN@Example.com ", "pw")).toBe(true);
  });

  it("fails safe when ADMIN_PASSWORD is unset or blank", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(verifyAdminCredentials("admin@example.com", "")).toBe(false);
    expect(verifyAdminCredentials("admin@example.com", "anything")).toBe(false);
  });

  it("fails safe when the allowlist is empty", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    vi.stubEnv("ADMIN_PASSWORD", "pw");
    expect(verifyAdminCredentials("admin@example.com", "pw")).toBe(false);
  });
});

describe("signAdminToken / verifyAdminToken", () => {
  it("round-trips a valid token back to the admin email", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    const token = signAdminToken("admin@example.com", NOW + 100);
    expect(verifyAdminToken(token, NOW)).toBe("admin@example.com");
  });

  it("rejects an expired token", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    const token = signAdminToken("admin@example.com", NOW - 1);
    expect(verifyAdminToken(token, NOW)).toBeNull();
  });

  it("rejects a tampered payload or signature", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    const token = signAdminToken("admin@example.com", NOW + 100);
    expect(verifyAdminToken(token + "x", NOW)).toBeNull();
    expect(verifyAdminToken(token.replace(/.$/, "0"), NOW)).toBeNull();
    expect(verifyAdminToken("garbage", NOW)).toBeNull();
    expect(verifyAdminToken("", NOW)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "secret-a");
    const token = signAdminToken("admin@example.com", NOW + 100);
    vi.stubEnv("BETTER_AUTH_SECRET", "secret-b");
    expect(verifyAdminToken(token, NOW)).toBeNull();
  });

  it("revokes a valid token once the email leaves the allowlist", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    const token = signAdminToken("admin@example.com", NOW + 100);
    expect(verifyAdminToken(token, NOW)).toBe("admin@example.com");
    vi.stubEnv("ADMIN_EMAILS", "someone-else@example.com");
    expect(verifyAdminToken(token, NOW)).toBeNull();
  });

  it("fails safe when no secret is configured", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    expect(signAdminToken("admin@example.com", NOW + 100)).toBe("");
    expect(verifyAdminToken("anything", NOW)).toBeNull();
  });
});
