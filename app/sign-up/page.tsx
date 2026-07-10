// app/sign-up/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { isValidEmail, PASSWORD_MIN } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { BRAND } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";
import { useParentalGate } from "@/components/parental-gate/parental-gate-provider";
import { track } from "@/lib/analytics";

type Errors = { name?: string; email?: string; password?: string };

export default function SignUpPage() {
  const router = useRouter();
  const requireAdult = useParentalGate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (!name.trim()) next.name = "Please tell us your name.";
    if (!email.trim()) next.email = "Please enter your email.";
    else if (!isValidEmail(email)) next.email = "That email does not look right. Please check for typos.";
    if (!password) next.password = "Please choose a password.";
    else if (password.length < PASSWORD_MIN) next.password = `Please use at least ${PASSWORD_MIN} characters so your account stays safe.`;
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Creating an account is a grown up action, so pass the parental gate first
    // (issue #32). A pass is remembered for this flow, so a parent who also tries
    // a social button is not challenged twice.
    const passedGate = await requireAdult("signup");
    if (!passedGate) return;

    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setFormError(
        friendlyAuthError(error, "We could not create your account. Please try again in a moment."),
      );
      return;
    }
    // Non-personal: records that an account was created and how. No name/email.
    track("signup_completed", { method: "email" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--pc-sky)] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_44px_-18px_rgba(22,40,58,0.4)] sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <BrandMark size="lg" />
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--pc-ink)]">
              {BRAND.name}
            </h1>
            <p className="text-sm font-semibold text-[var(--pc-sub)]">Create your account</p>
          </div>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="font-semibold text-[var(--pc-ink)]">Your name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <FieldError id="name-error">{errors.name}</FieldError>
          </div>
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
              className="h-11 rounded-xl border-[var(--pc-line)] px-3.5 text-base focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
            <FieldError id="email-error">{errors.email}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-[var(--pc-ink)]">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
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
              <p id="password-hint" className="text-xs font-semibold text-[var(--pc-sub)]">At least {PASSWORD_MIN} characters.</p>
            )}
          </div>
          {formError && <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{formError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl bg-[var(--pc-plum)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--pc-line)]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--pc-sub)]">or</span>
          <span className="h-px flex-1 bg-[var(--pc-line)]" />
        </div>
        <SocialButtons gatePurpose="signup" />

        <p className="mt-6 text-center text-sm text-[var(--pc-sub)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-bold text-[var(--pc-plum)] underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
