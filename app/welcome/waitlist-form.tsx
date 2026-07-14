"use client";
//
// app/welcome/waitlist-form.tsx
//
// The waitlist capture form on the public /welcome page (issue #68). Progressive
// enhancement via useActionState: name optional, email required. On success the
// form is replaced by a confirmation panel; on error the message is announced and
// the email field is flagged. A honeypot field ("company") catches basic bots.
//
// UI rules: the submit button is a chunky Paper Cut button that looks clickable
// (solid bottom edge, active press, focus ring, pointer cursor); all copy is dash
// free; all text is high contrast.
import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { joinWaitlist } from "@/lib/waitlist-actions";
import { WAITLIST_INITIAL_STATE } from "@/lib/waitlist-form-state";

const fieldClass =
  "h-11 rounded-xl border-[var(--pc-line)] bg-white px-3.5 text-base text-[var(--pc-ink)] focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, WAITLIST_INITIAL_STATE);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border-2 border-[var(--pc-leaf)] bg-white p-6 text-center shadow-[0_5px_0_var(--pc-leaf-ink)]"
      >
        <p className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
          {state.alreadyOnList ? "You are already with us" : "You are on the list"}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-[var(--pc-ink)]">{state.message}</p>
      </div>
    );
  }

  const emailError = state.status === "error" && state.field === "email" ? state.message : undefined;
  const formError = state.status === "error" && !state.field ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="waitlist-name" className="font-semibold text-[var(--pc-ink)]">
          Your name <span className="font-normal text-[var(--pc-sub)]">(optional)</span>
        </Label>
        <Input
          id="waitlist-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={60}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-email" className="font-semibold text-[var(--pc-ink)]">
          Email
        </Label>
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "waitlist-email-error" : undefined}
          className={fieldClass}
        />
        <FieldError id="waitlist-email-error">{emailError}</FieldError>
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. A
          filled value makes the server action treat the submit as spam. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="waitlist-company">Leave this field empty</label>
        <input
          id="waitlist-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {formError && (
        <p role="alert" className="text-sm font-semibold text-[var(--pc-poppy-ink)]">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-xl bg-[var(--pc-plum)] py-3 font-display font-bold text-white shadow-[0_5px_0_var(--pc-plum-ink)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding you..." : "Notify me at launch"}
      </button>

      <p className="text-center text-xs font-semibold text-[var(--pc-sub)]">
        A parent signs up here, not a child. We only use your email to tell you when we launch. See our{" "}
        <Link
          href="/privacy"
          className="cursor-pointer font-bold text-[var(--pc-plum)] underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
