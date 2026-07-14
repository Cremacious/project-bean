import { describe, it, expect, vi, beforeEach } from "vitest";
import * as waitlist from "@/lib/waitlist";
import { joinWaitlist } from "./waitlist-actions";
import { WAITLIST_INITIAL_STATE } from "./waitlist-form-state";

vi.mock("@/lib/waitlist", () => ({ addToWaitlist: vi.fn() }));

const addToWaitlist = vi.mocked(waitlist.addToWaitlist);

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

beforeEach(() => vi.clearAllMocks());

describe("joinWaitlist", () => {
  it("drops a honeypot submission as fake success without persisting", async () => {
    const result = await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "bot@spam.com", company: "Spam Co" }));
    expect(result).toMatchObject({ status: "success", alreadyOnList: false });
    expect(addToWaitlist).not.toHaveBeenCalled();
  });

  it("passes the email, name, and source through to the store", async () => {
    addToWaitlist.mockResolvedValue({ ok: true, status: "added" });
    await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "parent@example.com", name: "Sam" }));
    expect(addToWaitlist).toHaveBeenCalledWith({
      email: "parent@example.com",
      name: "Sam",
      source: "welcome",
    });
  });

  it("reports a new signup as success", async () => {
    addToWaitlist.mockResolvedValue({ ok: true, status: "added" });
    const result = await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "parent@example.com" }));
    expect(result).toMatchObject({ status: "success", alreadyOnList: false });
  });

  it("reassures a returning parent already on the list", async () => {
    addToWaitlist.mockResolvedValue({ ok: true, status: "already_on_list" });
    const result = await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "parent@example.com" }));
    expect(result).toMatchObject({ status: "success", alreadyOnList: true });
  });

  it("flags the email field on an invalid email", async () => {
    addToWaitlist.mockResolvedValue({ ok: false, reason: "invalid_email" });
    const result = await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "nope" }));
    expect(result).toMatchObject({ status: "error", field: "email" });
  });

  it("surfaces a generic error without a field on a server failure", async () => {
    addToWaitlist.mockResolvedValue({ ok: false, reason: "error" });
    const result = await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "parent@example.com" }));
    expect(result).toEqual({ status: "error", message: expect.any(String) });
  });

  it("has no dashes in any user facing message", async () => {
    for (const outcome of [
      { ok: true as const, status: "added" as const },
      { ok: true as const, status: "already_on_list" as const },
      { ok: false as const, reason: "invalid_email" as const },
      { ok: false as const, reason: "error" as const },
    ]) {
      addToWaitlist.mockResolvedValue(outcome);
      const result = await joinWaitlist(WAITLIST_INITIAL_STATE, form({ email: "parent@example.com" }));
      if ("message" in result) expect(result.message).not.toMatch(/[—–-]/);
    }
  });
});
