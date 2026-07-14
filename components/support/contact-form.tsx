"use client";
//
// components/support/contact-form.tsx
//
// The Help page contact form (issue #72). Progressive enhancement via
// useActionState: email and a message are required, name is optional. On success
// the form is replaced by a confirmation panel; on error the message is announced
// and the offending field is flagged. A honeypot field ("company") catches basic
// bots. The server action (lib/support-actions.ts) revalidates everything, so this
// component is only the presentation.
//
// UI rules: the submit button is a chunky Paper Cut button that looks clickable
// (solid bottom edge, active press, focus ring, pointer cursor); all copy is dash
// free; all text is high contrast.
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { submitSupportRequest } from "@/lib/support-actions";
import { SUPPORT_INITIAL_STATE } from "@/lib/support-form-state";
import { SUPPORT_MESSAGE_MAX } from "@/lib/support";

const fieldClass =
  "h-11 rounded-xl border-[var(--pc-line)] bg-white px-3.5 text-base text-[var(--pc-ink)] focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitSupportRequest,
    SUPPORT_INITIAL_STATE,
  );

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border-2 border-[var(--pc-leaf)] bg-white p-6 shadow-[0_5px_0_var(--pc-leaf-ink)]"
      >
        <p className="font-display text-lg font-extrabold text-[var(--pc-ink)]">
          Message sent
        </p>
        <p className="mt-1.5 text-sm font-semibold text-[var(--pc-ink)]">{state.message}</p>
      </div>
    );
  }

  const emailError = state.status === "error" && state.field === "email" ? state.message : undefined;
  const messageError =
    state.status === "error" && state.field === "message" ? state.message : undefined;
  const formError = state.status === "error" && !state.field ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4 text-left">
      <div className="space-y-1.5">
        <Label htmlFor="support-name" className="font-semibold text-[var(--pc-ink)]">
          Your name <span className="font-normal text-[var(--pc-sub)]">(optional)</span>
        </Label>
        <Input
          id="support-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={60}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-email" className="font-semibold text-[var(--pc-ink)]">
          Your email
        </Label>
        <Input
          id="support-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "support-email-error" : undefined}
          className={fieldClass}
        />
        <FieldError id="support-email-error">{emailError}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-message" className="font-semibold text-[var(--pc-ink)]">
          How can we help?
        </Label>
        <textarea
          id="support-message"
          name="message"
          required
          rows={5}
          maxLength={SUPPORT_MESSAGE_MAX}
          aria-invalid={!!messageError}
          aria-describedby={messageError ? "support-message-error" : undefined}
          className="w-full rounded-xl border border-[var(--pc-line)] bg-white px-3.5 py-2.5 text-base text-[var(--pc-ink)] outline-none focus-visible:border-[var(--pc-plum)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <FieldError id="support-message-error">{messageError}</FieldError>
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. A
          filled value makes the server action treat the submit as spam. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="support-company">Leave this field empty</label>
        <input id="support-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
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
        {pending ? "Sending..." : "Send message"}
      </button>

      <p className="text-xs font-semibold text-[var(--pc-sub)]">
        A parent writes to us here, not a child. We only use your email to reply to this message.
      </p>
    </form>
  );
}
