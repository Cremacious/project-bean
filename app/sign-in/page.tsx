// app/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { isValidEmail } from "@bedtime-quests/core/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { AuthShell, authSubmitClass } from "@/components/auth/auth-shell";

type Errors = { email?: string; password?: string };

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!isValidEmail(email)) next.email = "That email does not look right. Please check for typos.";
    if (!password) next.password = "Please enter your password.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setFormError(
        friendlyAuthError(error, "We could not sign you in. Please check your email and password, then try again."),
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell heading="Welcome back" subheading="Sign in to keep the story going.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-semibold text-[var(--pc-ink)]">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="h-11 rounded-xl border-[var(--pc-line)] bg-white px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <FieldError id="email-error">{errors.email}</FieldError>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="font-semibold text-[var(--pc-ink)]">Password</Label>
              <Link
                href="/forgot-password"
                className="cursor-pointer text-sm font-bold text-[var(--pc-plum-ink)] underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              className="bg-white"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <FieldError id="password-error">{errors.password}</FieldError>
          </div>
          {formError && <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{formError}</p>}
          <button type="submit" disabled={loading} className={authSubmitClass}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--pc-line)]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--pc-sub)]">or</span>
          <span className="h-px flex-1 bg-[var(--pc-line)]" />
        </div>
        <SocialButtons />

        <p className="mt-6 text-center text-sm font-semibold text-[var(--pc-sub)] lg:text-left">
          New here?{" "}
          <Link href="/sign-up" className="font-bold text-[var(--pc-plum-ink)] underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
      </AuthShell>
  );
}
