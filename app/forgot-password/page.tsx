// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { isValidEmail } from "@bedtime-quests/core/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("That email does not look right. Please check for typos.");
      return;
    }
    setEmailError(undefined);

    setLoading(true);
    const { error } = await requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      setFormError(
        friendlyAuthError(error, "We could not send that email just now. Please try again in a moment."),
      );
      return;
    }
    // BetterAuth returns success whether or not the email exists, so we never
    // reveal which addresses have accounts.
    setSent(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--pc-sky)] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.4)] sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <BrandMark size="lg" />
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              {sent ? "Check your email" : "Reset your password"}
            </h1>
            <p className="text-sm font-semibold text-[var(--pc-sub)]">
              {sent ? "A reset link is on its way." : "We will email you a link to set a new one."}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-5">
            <p className="text-center text-sm font-semibold text-[var(--pc-ink)]">
              If an account exists for{" "}
              <span className="font-bold">{email.trim()}</span>, a link to reset your password is on
              its way. It works for one hour. Please check your spam folder if you do not see it.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setFormError(null);
              }}
              className="w-full cursor-pointer rounded-xl border border-[var(--pc-line)] bg-white py-3 font-display font-bold text-[var(--pc-ink)] shadow-[0_3px_0_var(--pc-line)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5"
            >
              Use a different email
            </button>
            <p className="text-center text-sm text-[var(--pc-sub)]">
              <Link
                href="/sign-in"
                className="font-bold text-[var(--pc-plum)] underline-offset-2 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold text-[var(--pc-ink)]">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(undefined);
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                />
                <FieldError id="email-error">{emailError}</FieldError>
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
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--pc-sub)]">
              Remembered it?{" "}
              <Link
                href="/sign-in"
                className="font-bold text-[var(--pc-plum)] underline-offset-2 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
