import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dbClient from "@/db/client";
import * as email from "@/lib/email";
import { addToWaitlist } from "./waitlist";

// Mock the persistence seam and the email module so the logic is tested without a
// real database or email provider (mirrors lib/entitlements.test.ts).
vi.mock("@/db/client", () => ({ db: { insert: vi.fn() } }));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  waitlistConfirmationEmail: vi.fn(() => ({ subject: "s", html: "<p>h</p>", text: "t" })),
}));

const insert = vi.mocked(dbClient.db.insert);
const sendEmail = vi.mocked(email.sendEmail);
const confirmationTemplate = vi.mocked(email.waitlistConfirmationEmail);

// Rebuild the db.insert(...).values(...).onConflictDoNothing(...).returning(...)
// chain for one call, resolving `returning` to the given rows. An empty array
// models the unique-email conflict (already on the list).
function mockInsert(returningRows: Array<{ id: number }>) {
  const returning = vi.fn().mockResolvedValue(returningRows);
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoNothing }));
  insert.mockReturnValue({ values } as never);
  return { values, onConflictDoNothing, returning };
}

beforeEach(() => {
  vi.clearAllMocks();
  sendEmail.mockResolvedValue(undefined);
});

describe("addToWaitlist", () => {
  it("rejects a malformed email without touching the database or email", async () => {
    const result = await addToWaitlist({ email: "not-an-email" });
    expect(result).toEqual({ ok: false, reason: "invalid_email" });
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("stores a brand new signup and sends a confirmation email", async () => {
    const chain = mockInsert([{ id: 1 }]);
    const result = await addToWaitlist({ email: "parent@example.com", name: "Sam" });

    expect(result).toEqual({ ok: true, status: "added" });
    expect(chain.values).toHaveBeenCalledWith({
      email: "parent@example.com",
      name: "Sam",
      source: "welcome",
    });
    expect(confirmationTemplate).toHaveBeenCalledWith({ name: "Sam" });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: "parent@example.com" });
  });

  it("normalises the email and name before storing", async () => {
    const chain = mockInsert([{ id: 2 }]);
    await addToWaitlist({ email: "  Parent@Example.COM  ", name: "  Jamie  " });
    expect(chain.values).toHaveBeenCalledWith({
      email: "parent@example.com",
      name: "Jamie",
      source: "welcome",
    });
  });

  it("stores a blank name as null and honors a custom source", async () => {
    const chain = mockInsert([{ id: 3 }]);
    await addToWaitlist({ email: "a@b.com", name: "   ", source: "campaign" });
    expect(chain.values).toHaveBeenCalledWith({ email: "a@b.com", name: null, source: "campaign" });
  });

  it("treats a duplicate email as a graceful success and sends no email", async () => {
    // Empty returning rows = onConflictDoNothing skipped the insert.
    mockInsert([]);
    const result = await addToWaitlist({ email: "parent@example.com" });
    expect(result).toEqual({ ok: true, status: "already_on_list" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("fails safe when the database throws", async () => {
    const returning = vi.fn().mockRejectedValue(new Error("db down"));
    insert.mockReturnValue({
      values: () => ({ onConflictDoNothing: () => ({ returning }) }),
    } as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await addToWaitlist({ email: "parent@example.com" });
    expect(result).toEqual({ ok: false, reason: "error" });
    errorSpy.mockRestore();
  });

  it("still succeeds when the confirmation email fails to send", async () => {
    mockInsert([{ id: 4 }]);
    sendEmail.mockRejectedValue(new Error("provider 500"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await addToWaitlist({ email: "parent@example.com" });
    expect(result).toEqual({ ok: true, status: "added" });
    errorSpy.mockRestore();
  });
});
