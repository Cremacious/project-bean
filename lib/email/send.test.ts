import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "./send";

const EMAIL = {
  to: "parent@example.com",
  subject: "Reset your Bedtime Quests password",
  html: "<p>hi</p>",
  text: "hi",
};

describe("sendEmail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("logs instead of sending when RESEND_API_KEY is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(sendEmail(EMAIL)).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    // The logged fallback carries the body so a dev can follow the link locally.
    expect(warn.mock.calls[0][0]).toContain("hi");
  });

  it("posts to Resend with auth and sender when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "Bedtime Quests <hello@bedtimequests.app>");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(sendEmail(EMAIL)).resolves.toBeUndefined();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init?.body as string);
    expect(body.from).toBe("Bedtime Quests <hello@bedtimequests.app>");
    expect(body.to).toBe("parent@example.com");
    expect(body.subject).toBe(EMAIL.subject);
  });

  it("throws when the provider returns a non ok response", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "Bedtime Quests <hello@bedtimequests.app>");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("invalid sender", { status: 422 }),
    );

    await expect(sendEmail(EMAIL)).rejects.toThrow(/422/);
  });
});
