import { describe, it, expect } from "vitest";
import { resetPasswordEmail } from "./templates";

const URL = "https://bedtimequests.app/api/auth/reset-password/tok123?callbackURL=abc";

describe("resetPasswordEmail", () => {
  it("greets the parent by name when we have one", () => {
    const { html, text } = resetPasswordEmail({ name: "Sam", url: URL });
    expect(html).toContain("Hi Sam,");
    expect(text).toContain("Hi Sam,");
  });

  it("falls back to a warm generic greeting without a name", () => {
    const { text } = resetPasswordEmail({ name: null, url: URL });
    expect(text).toContain("Hi there,");
  });

  it("includes the reset link in both html and text", () => {
    const { html, text } = resetPasswordEmail({ name: "Sam", url: URL });
    expect(html).toContain(URL);
    expect(text).toContain(URL);
  });

  it("has an on-brand, informative subject", () => {
    const { subject } = resetPasswordEmail({ name: "Sam", url: URL });
    expect(subject).toBe("Reset your Bedtime Quests password");
  });

  it("escapes html-significant characters in the parent name", () => {
    const { html } = resetPasswordEmail({ name: "<script>", url: URL });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("uses no en or em dashes anywhere, per the copy rules", () => {
    const { subject, html, text } = resetPasswordEmail({ name: "Sam", url: URL });
    expect(subject).not.toMatch(/[–—]/);
    expect(html).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/[–—]/);
  });

  it("keeps the plain text body free of hyphen punctuation", () => {
    // The URL legitimately may contain hyphens; the human sentences must not.
    const { text } = resetPasswordEmail({ name: "Sam", url: URL });
    const withoutUrl = text.split("\n").filter((line) => !line.includes(URL)).join("\n");
    expect(withoutUrl).not.toMatch(/-/);
  });
});
