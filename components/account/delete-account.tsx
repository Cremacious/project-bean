"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FieldError } from "@/components/ui/field-error";
import { isDeleteConfirmed, DELETE_CONFIRM_WORD } from "@/lib/validation";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canConfirm = isDeleteConfirmed(word) && password.length > 0;

  function reset() {
    setOpen(false);
    setWord("");
    setPassword("");
    setError(null);
  }

  function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isDeleteConfirmed(word)) {
      setError(`Please type ${DELETE_CONFIRM_WORD} to confirm.`);
      return;
    }
    if (!password) {
      setError("Please enter your password to confirm.");
      return;
    }
    startTransition(async () => {
      const { error: apiError } = await authClient.deleteUser({ password });
      if (apiError) {
        setError(apiError.message?.trim() || "We could not delete your account. Please check your password and try again.");
        return;
      }
      // The session cookie is cleared by the delete response. Send the parent
      // back to sign in; their account and all data are now gone.
      router.push("/sign-in");
      router.refresh();
    });
  }

  const fieldClass =
    "h-12 w-full rounded-2xl border border-[var(--pc-poppy)] bg-white px-4 text-base font-semibold text-[var(--pc-ink)] outline-none placeholder:text-[var(--pc-sub)] focus-visible:ring-2 focus-visible:ring-[var(--pc-poppy-ink)] disabled:opacity-60";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] cursor-pointer rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-[var(--pc-poppy)] px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-poppy-ink)] active:translate-y-0.5"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form onSubmit={onConfirm} noValidate className="space-y-4">
      <p className="text-base font-semibold text-[var(--pc-ink)]">
        This permanently deletes your account, every child profile, and all of their reading
        progress. This cannot be undone.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="delete-word" className="text-sm font-bold text-[var(--pc-ink)]">
          Type {DELETE_CONFIRM_WORD} to confirm
        </label>
        <input
          id="delete-word"
          type="text"
          autoComplete="off"
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            if (error) setError(null);
          }}
          className={fieldClass}
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="delete-password" className="text-sm font-bold text-[var(--pc-ink)]">
          Enter your password
        </label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "delete-error" : undefined}
          className={fieldClass}
          disabled={isPending}
        />
      </div>

      <FieldError id="delete-error">{error}</FieldError>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isPending || !canConfirm}
          className="min-h-[44px] cursor-pointer rounded-2xl border-2 border-[var(--pc-poppy-ink)] bg-[var(--pc-poppy)] px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-poppy-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--pc-poppy-ink)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="min-h-[44px] cursor-pointer rounded-2xl border border-[var(--pc-line)] bg-white px-5 py-3 text-base font-bold text-[var(--pc-ink)] outline-none transition-colors hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
