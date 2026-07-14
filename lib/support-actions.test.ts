import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the email module so no real send is attempted; keep a fixed rendered
// message so we can assert the delivery target and that a send happened at all.
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => {}),
  supportRequestEmail: vi.fn(() => ({ subject: "s", html: "<p>h</p>", text: "t" })),
}));

import { submitSupportRequest } from "@/lib/support-actions";
import { sendEmail } from "@/lib/email";
import { SUPPORT_INITIAL_STATE } from "@/lib/support-form-state";

const send = vi.mocked(sendEmail);

/** Build the FormData the client form would post. */
function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID = { email: "parent@example.com", message: "How do I add a second child?" };

describe("submitSupportRequest", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("silently succeeds and sends nothing when the honeypot is filled", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "help@bedtimequests.com");
    const state = await submitSupportRequest(SUPPORT_INITIAL_STATE, form({ ...VALID, company: "bot" }));
    expect(state.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("returns a field error for an invalid email and sends nothing", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "help@bedtimequests.com");
    const state = await submitSupportRequest(SUPPORT_INITIAL_STATE, form({ email: "nope", message: "hi there" }));
    expect(state).toMatchObject({ status: "error", field: "email" });
    expect(send).not.toHaveBeenCalled();
  });

  it("returns a field error for an empty message and sends nothing", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "help@bedtimequests.com");
    const state = await submitSupportRequest(SUPPORT_INITIAL_STATE, form({ email: "a@b.co", message: "   " }));
    expect(state).toMatchObject({ status: "error", field: "message" });
    expect(send).not.toHaveBeenCalled();
  });

  it("delivers to the configured inbox on a valid submission", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "help@bedtimequests.com");
    const state = await submitSupportRequest(SUPPORT_INITIAL_STATE, form(VALID));
    expect(state.status).toBe("success");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "help@bedtimequests.com" }));
  });

  it("accepts the message as a no-op when no inbox is configured (email disabled)", async () => {
    // No SUPPORT_EMAIL set and the published address is still a placeholder.
    const state = await submitSupportRequest(SUPPORT_INITIAL_STATE, form(VALID));
    expect(state.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("returns an error when the send itself fails", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "help@bedtimequests.com");
    send.mockRejectedValueOnce(new Error("provider down"));
    const state = await submitSupportRequest(SUPPORT_INITIAL_STATE, form(VALID));
    expect(state.status).toBe("error");
  });
});
