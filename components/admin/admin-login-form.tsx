// components/admin/admin-login-form.tsx
"use client";
import { useActionState } from "react";
import { adminLogin } from "@/lib/admin-auth-actions";
import { ADMIN_LOGIN_INITIAL } from "@/lib/admin-auth-state";
import { PasswordInput } from "@/components/ui/password-input";
import { field, labelCls } from "@/components/admin/styles";

/**
 * The /admin login (issue #85). Posts to the adminLogin server action, which
 * verifies the email is on ADMIN_EMAILS and the password equals ADMIN_PASSWORD
 * (constant-time) before establishing the admin session. All checks are
 * server-side; this form only collects and displays.
 */
export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, ADMIN_LOGIN_INITIAL);

  return (
    <div className="w-full max-w-sm rounded-3xl border border-[var(--pc-line)] bg-white p-6 shadow-[0_6px_0_var(--pc-line)]">
      <h1 className="font-display text-2xl font-extrabold text-[var(--pc-ink)]">Admin sign in</h1>
      <p className="mt-1 text-sm text-[var(--pc-sub)]">
        This area is for site administrators. Enter your admin email and password.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="admin-email" className={labelCls}>Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={field}
            placeholder="you@example.com"
            disabled={pending}
            aria-invalid={state.status === "error"}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className={labelCls}>Password</label>
          <PasswordInput
            id="admin-password"
            name="password"
            autoComplete="current-password"
            required
            className={field}
            placeholder="Admin password"
            disabled={pending}
            aria-invalid={state.status === "error"}
          />
        </div>

        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full cursor-pointer rounded-2xl bg-[var(--pc-plum)] px-5 py-3 text-base font-bold text-white shadow-[0_4px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
