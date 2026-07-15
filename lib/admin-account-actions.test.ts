import { describe, it, expect, vi, beforeEach } from "vitest";
import * as adminSession from "@/lib/admin-session";
import * as store from "@/lib/entitlement-store";
import * as audit from "@/lib/admin/audit";

// The account-management actions gate on the admin session and touch the db at
// the persistence seam. Mock the session, the override store, the audit writer,
// and a minimal chainable db so we assert the LOGIC (gating, typed-confirmation,
// cascade delete, session revocation) without a real database.
vi.mock("@/lib/admin-session", () => ({ requireAdminEmail: vi.fn() }));
vi.mock("@/lib/entitlement-store", () => ({ setAdminOverride: vi.fn() }));
vi.mock("@/lib/admin/audit", () => ({ recordAdminAudit: vi.fn() }));

let selectRows: unknown[] = [];
const deleteWhere = vi.fn().mockResolvedValue(undefined);
const updateWhere = vi.fn().mockResolvedValue(undefined);
const deleteWhereChain = { where: deleteWhere };
const deleteSpy = vi.fn(() => deleteWhereChain);
const updateSpy = vi.fn(() => ({ set: () => ({ where: updateWhere }) }));
const selectSpy = vi.fn(() => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(selectRows) }) }),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: () => selectSpy(),
    update: () => updateSpy(),
    delete: () => deleteSpy(),
  },
}));

import { setPremiumOverride, setAccountDisabled, removeAccount } from "./admin-account-actions";

const requireAdminEmail = vi.mocked(adminSession.requireAdminEmail);
const setAdminOverride = vi.mocked(store.setAdminOverride);
const recordAdminAudit = vi.mocked(audit.recordAdminAudit);

beforeEach(() => {
  vi.clearAllMocks();
  selectRows = [];
  requireAdminEmail.mockResolvedValue("admin@example.com");
});

describe("admin gating", () => {
  it("denies every action without an admin session and touches nothing", async () => {
    requireAdminEmail.mockRejectedValue(new Error("Not allowed"));

    expect(await setPremiumOverride("p1", true)).toEqual({ ok: false, error: "Not allowed" });
    expect(await setAccountDisabled("p1", true)).toEqual({ ok: false, error: "Not allowed" });
    expect(await removeAccount("p1", "pat@example.com")).toEqual({ ok: false, error: "Not allowed" });

    expect(setAdminOverride).not.toHaveBeenCalled();
    expect(updateWhere).not.toHaveBeenCalled();
    expect(deleteWhere).not.toHaveBeenCalled();
  });
});

describe("setPremiumOverride", () => {
  it("grants premium and records an audit entry", async () => {
    expect(await setPremiumOverride("p1", true)).toEqual({ ok: true });
    expect(setAdminOverride).toHaveBeenCalledWith("p1", true);
    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "premium_grant", targetId: "p1", adminEmail: "admin@example.com" }),
    );
  });

  it("uses distinct audit actions for revoke and clear", async () => {
    await setPremiumOverride("p1", false);
    expect(recordAdminAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "premium_revoke" }));
    await setPremiumOverride("p1", null);
    expect(recordAdminAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "premium_clear" }));
  });
});

describe("setAccountDisabled", () => {
  it("disables the account and revokes its sessions", async () => {
    expect(await setAccountDisabled("p1", true)).toEqual({ ok: true });
    expect(updateWhere).toHaveBeenCalledTimes(1); // stamp disabledAt
    expect(deleteWhere).toHaveBeenCalledTimes(1); // revoke sessions
    expect(recordAdminAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "account_disable" }));
  });

  it("enables the account without revoking sessions", async () => {
    expect(await setAccountDisabled("p1", false)).toEqual({ ok: true });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(deleteWhere).not.toHaveBeenCalled();
    expect(recordAdminAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "account_enable" }));
  });
});

describe("removeAccount", () => {
  it("refuses when the typed email does not match, and deletes nothing", async () => {
    selectRows = [{ email: "pat@example.com" }];
    const res = await removeAccount("p1", "wrong@example.com");
    expect(res.ok).toBe(false);
    expect(deleteWhere).not.toHaveBeenCalled();
    expect(recordAdminAudit).not.toHaveBeenCalled();
  });

  it("refuses when the account no longer exists", async () => {
    selectRows = [];
    const res = await removeAccount("p1", "pat@example.com");
    expect(res.ok).toBe(false);
    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it("removes the account (cascade) after audit when the email matches, case-insensitively", async () => {
    selectRows = [{ email: "Pat@Example.com" }];
    const res = await removeAccount("p1", "  pat@example.com ");
    expect(res).toEqual({ ok: true });
    // Audit is written BEFORE the delete so it outlives the removed row.
    const auditOrder = recordAdminAudit.mock.invocationCallOrder[0];
    const deleteOrder = deleteWhere.mock.invocationCallOrder[0];
    expect(auditOrder).toBeLessThan(deleteOrder);
    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "account_remove", targetId: "p1", detail: "Pat@Example.com" }),
    );
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });
});
