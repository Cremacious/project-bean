// components/admin/account-controls.tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPremiumOverride, setAccountDisabled, removeAccount } from "@/lib/admin-account-actions";
import { field, labelCls } from "@/components/admin/styles";

type Override = boolean | null;

/**
 * Management controls for one account (issue #85): premium override (tri-state),
 * disable/enable, and a confirmed permanent removal. Every button calls a server
 * action that re-checks the admin session; the removal requires typing the exact
 * email, re-verified on the server. Destructive controls are visually distinct.
 */
export function AccountControls({
  userId,
  email,
  override,
  disabled,
}: {
  userId: string;
  email: string;
  override: Override;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Premium override */}
      <div className="rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
        <h2 className="font-display text-lg font-extrabold">Premium status</h2>
        <p className="mt-1 text-sm text-[var(--pc-sub)]">
          Force premium on or off, or follow the normal billing state. This takes effect right away.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <OverrideButton active={override === true} disabled={pending} onClick={() => run(() => setPremiumOverride(userId, true))}>
            Grant premium
          </OverrideButton>
          <OverrideButton active={override === false} disabled={pending} onClick={() => run(() => setPremiumOverride(userId, false))}>
            Revoke premium
          </OverrideButton>
          <OverrideButton active={override === null} disabled={pending} onClick={() => run(() => setPremiumOverride(userId, null))}>
            Follow billing
          </OverrideButton>
        </div>
      </div>

      {/* Moderation */}
      <div className="rounded-2xl border border-[var(--pc-line)] bg-white p-4 shadow-[0_4px_0_var(--pc-line)]">
        <h2 className="font-display text-lg font-extrabold">Moderation</h2>
        <p className="mt-1 text-sm text-[var(--pc-sub)]">
          {disabled
            ? "This account is disabled. It cannot use the app until you enable it again."
            : "Disable this account to block it from using the app. This is reversible."}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setAccountDisabled(userId, !disabled))}
          className="mt-3 cursor-pointer rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: disabled ? "var(--pc-leaf-ink)" : "var(--pc-poppy-ink)" }}
        >
          {disabled ? "Enable account" : "Disable account"}
        </button>
      </div>

      {/* Danger zone */}
      <DangerZone userId={userId} email={email} pending={pending} onRemove={run} router={router} />

      {error && (
        <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{error}</p>
      )}
    </div>
  );
}

function OverrideButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || active}
      aria-pressed={active}
      className={`cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-bold outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed ${
        active
          ? "border-[var(--pc-plum-ink)] bg-[var(--pc-plum)] text-white shadow-[0_4px_0_var(--pc-plum-ink)] disabled:opacity-100"
          : "border-[var(--pc-line)] bg-white text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] disabled:opacity-50"
      }`}
    >
      {active ? `${children} ✓` : children}
    </button>
  );
}

function DangerZone({
  userId,
  email,
  pending,
  onRemove,
  router,
}: {
  userId: string;
  email: string;
  pending: boolean;
  onRemove: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase();

  function confirmRemove() {
    onRemove(async () => {
      const res = await removeAccount(userId, typed);
      if (res.ok) router.push("/admin/accounts");
      return res;
    });
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-[#FDECEC] p-4">
      <h2 className="font-display text-lg font-extrabold text-[var(--pc-poppy-ink)]">Danger zone</h2>
      <p className="mt-1 text-sm font-semibold text-[var(--pc-ink)]">
        Permanently remove this account and all of its data. Children and progress are deleted too. This cannot be undone.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 cursor-pointer rounded-2xl bg-[var(--pc-poppy-ink)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
        >
          Remove account
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <label htmlFor="confirm-email" className={labelCls}>
            Type the account email to confirm
          </label>
          <input
            id="confirm-email"
            className={field}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
            autoComplete="off"
            disabled={pending}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmRemove}
              disabled={!matches || pending}
              className="cursor-pointer rounded-2xl bg-[var(--pc-poppy-ink)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Removing…" : "Permanently remove"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setTyped(""); }}
              disabled={pending}
              className="cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--pc-ink)] shadow-[0_4px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
