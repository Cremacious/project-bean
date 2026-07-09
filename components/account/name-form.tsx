"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FieldError } from "@/components/ui/field-error";
import { isValidDisplayName, DISPLAY_NAME_MAX } from "@/lib/validation";

export function NameForm({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const clean = name.trim();
  const unchanged = clean === currentName.trim();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!isValidDisplayName(name)) {
      setError(`Please enter a name between 1 and ${DISPLAY_NAME_MAX} characters.`);
      return;
    }
    startTransition(async () => {
      const { error: apiError } = await authClient.updateUser({ name: clean });
      if (apiError) {
        setError(apiError.message?.trim() || "We could not save your name. Please try again in a moment.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="display-name" className="text-sm font-bold text-[var(--pc-ink)]">
          Display name
        </label>
        <input
          id="display-name"
          type="text"
          value={name}
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="name"
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
            if (saved) setSaved(false);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "display-name-error" : undefined}
          className="h-12 w-full rounded-2xl border border-[var(--pc-line)] bg-white px-4 text-base font-semibold text-[var(--pc-ink)] outline-none placeholder:text-[var(--pc-sub)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          disabled={isPending}
        />
        <FieldError id="display-name-error">{error}</FieldError>
        {saved && (
          <p role="status" className="text-sm font-semibold text-[var(--pc-plum-ink)]">
            Your name is saved.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || unchanged}
        className="min-h-[44px] cursor-pointer rounded-2xl px-5 py-3 text-base font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--pc-plum)" }}
      >
        {isPending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
