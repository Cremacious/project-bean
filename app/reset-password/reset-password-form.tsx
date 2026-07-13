// app/reset-password/reset-password-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { PASSWORD_MIN } from "@bedtime-quests/core/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

type Errors = { password?: string; confirm?: string };

/** Shared card wrapper so every state on this route looks the same. */
function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--pc-sky)] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.4)] sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <BrandMark size="lg" />
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              {title}
            </h1>
            <p className="text-sm font-semibold text-[var(--pc-sub)]">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

export function ResetPasswordForm({
  token,
  tokenError,
}: {
  token: string | null;
  tokenError: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // `expired` starts true when the link arrived with an error or without a
  // token, and can flip on if the server rejects the token at submit time.
  const [expired, setExpired] = useState<boolean>(!!tokenError || !token);
  const [done, setDone] = useState(false);

  // The link is missing, malformed, or past its one hour window.
  if (expired) {
    return (
      <Shell title="This link expired" subtitle="Password reset links work for one hour.">
        <div className="space-y-5">
          <p className="text-center text-sm font-semibold text-[var(--pc-ink)]">
            For your safety this reset link is no longer valid. Please request a fresh one and we
            will email you a new link right away.
          </p>
          <Link
            href="/forgot-password"
            className="block w-full cursor-pointer rounded-xl bg-[var(--pc-plum)] py-3 text-center font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Request a new link
          </Link>
          <p className="text-center text-sm text-[var(--pc-sub)]">
            <Link
              href="/sign-in"
              className="font-bold text-[var(--pc-plum)] underline-offset-2 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </Shell>
    );
  }

  // Password successfully changed.
  if (done) {
    return (
      <Shell title="Password updated" subtitle="You are all set.">
        <div className="space-y-5">
          <p className="text-center text-sm font-semibold text-[var(--pc-ink)]">
            Your new password is saved. You can sign in with it now.
          </p>
          <Link
            href="/sign-in"
            className="block w-full cursor-pointer rounded-xl bg-[var(--pc-leaf)] py-3 text-center font-display font-bold text-white shadow-[0_5px_0_var(--pc-leaf-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
          >
            Go to sign in
          </Link>
        </div>
      </Shell>
    );
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!password) next.password = "Please choose a new password.";
    else if (password.length < PASSWORD_MIN)
      next.password = `Please use at least ${PASSWORD_MIN} characters so your account stays safe.`;
    if (!confirm) next.confirm = "Please type your new password again.";
    else if (confirm !== password) next.confirm = "Those passwords do not match. Please try again.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!token) {
      setExpired(true);
      return;
    }

    setLoading(true);
    const { error } = await resetPassword({ newPassword: password, token });
    setLoading(false);

    if (error) {
      // A rejected token means the link lapsed between the click and the submit.
      if (error.status === 400) {
        setExpired(true);
        return;
      }
      setFormError(
        friendlyAuthError(error, "We could not update your password just now. Please try again."),
      );
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <Shell title="Choose a new password" subtitle={`Almost done with ${BRAND.name}.`}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-semibold text-[var(--pc-ink)]">
            New password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
            className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          {errors.password ? (
            <FieldError id="password-error">{errors.password}</FieldError>
          ) : (
            <p id="password-hint" className="text-xs font-semibold text-[var(--pc-sub)]">
              At least {PASSWORD_MIN} characters.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="font-semibold text-[var(--pc-ink)]">
            Confirm new password
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <FieldError id="confirm-error">{errors.confirm}</FieldError>
        </div>
        {formError && (
          <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-xl bg-[var(--pc-plum)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </Shell>
  );
}
