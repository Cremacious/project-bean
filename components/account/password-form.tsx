"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { FieldError } from "@/components/ui/field-error";
import { PASSWORD_MIN } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";

type Errors = { current?: string; next?: string; confirm?: string };

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function validate(): Errors {
    const found: Errors = {};
    if (!current) found.current = "Please enter your current password.";
    if (!next) found.next = "Please choose a new password.";
    else if (next.length < PASSWORD_MIN) found.next = `Please use at least ${PASSWORD_MIN} characters so your account stays safe.`;
    if (confirm !== next) found.confirm = "The two passwords do not match.";
    return found;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaved(false);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (error) {
        setFormError(
          friendlyAuthError(error, "We could not change your password. Please check your current password and try again."),
        );
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
    });
  }

  const fieldClass =
    "h-12 w-full rounded-2xl border border-[var(--pc-line)] bg-white px-4 text-base font-semibold text-[var(--pc-ink)] outline-none placeholder:text-[var(--pc-sub)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="current-password" className="text-sm font-bold text-[var(--pc-ink)]">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            if (errors.current) setErrors((p) => ({ ...p, current: undefined }));
            if (formError) setFormError(null);
            if (saved) setSaved(false);
          }}
          aria-invalid={!!errors.current}
          aria-describedby={errors.current ? "current-password-error" : undefined}
          className={fieldClass}
          disabled={isPending}
        />
        <FieldError id="current-password-error">{errors.current}</FieldError>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-bold text-[var(--pc-ink)]">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            if (errors.next) setErrors((p) => ({ ...p, next: undefined }));
            if (saved) setSaved(false);
          }}
          aria-invalid={!!errors.next}
          aria-describedby={errors.next ? "new-password-error" : "new-password-hint"}
          className={fieldClass}
          disabled={isPending}
        />
        {errors.next ? (
          <FieldError id="new-password-error">{errors.next}</FieldError>
        ) : (
          <p id="new-password-hint" className="text-xs font-semibold text-[var(--pc-sub)]">
            At least {PASSWORD_MIN} characters.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-sm font-bold text-[var(--pc-ink)]">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
            if (saved) setSaved(false);
          }}
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "confirm-password-error" : undefined}
          className={fieldClass}
          disabled={isPending}
        />
        <FieldError id="confirm-password-error">{errors.confirm}</FieldError>
      </div>

      {formError && (
        <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">
          {formError}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm font-semibold text-[var(--pc-plum-ink)]">
          Your password is changed.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] cursor-pointer rounded-2xl px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--pc-plum)" }}
      >
        {isPending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
