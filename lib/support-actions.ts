"use server";
//
// lib/support-actions.ts
//
// The "use server" seam the Help page contact form calls (issue #72). Used with
// React's useActionState, so its signature is (prevState, formData) and it returns
// the next form state. Validation lives in lib/support.ts and email rendering in
// lib/email; this wrapper reads the form, applies a spam honeypot, decides whether
// there is an inbox to deliver to, and maps the result to warm, dash free copy.
//
// Security: Server Actions are reachable by direct POST, so all validation runs
// here on the server (validateSupportRequest) rather than trusting the caller.
//
// A "use server" file may only export async functions, so the form state shape and
// its initial value live in lib/support-form-state.ts, not here.
import { validateSupportRequest, resolveSupportInbox } from "@/lib/support";
import { sendEmail, supportRequestEmail } from "@/lib/email";
import type { SupportFormState } from "@/lib/support-form-state";

const SUCCESS_MESSAGE =
  "Thanks for reaching out. We got your message and will reply to your email as soon as we can.";
const ERROR_MESSAGE = "Something went wrong on our end. Please try again, or email us directly.";

export async function submitSupportRequest(
  _prevState: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  // Honeypot: a hidden field a real parent never sees or fills. If a bot fills it,
  // report success without sending anything, so the bot gets no signal it was caught.
  const trap = (formData.get("company") ?? "").toString();
  if (trap.trim()) {
    return { status: "success", message: SUCCESS_MESSAGE };
  }

  const validation = validateSupportRequest({
    email: (formData.get("email") ?? "").toString(),
    message: (formData.get("message") ?? "").toString(),
    name: (formData.get("name") ?? "").toString(),
  });

  if (!validation.ok) {
    return { status: "error", field: validation.field, message: validation.message };
  }

  const inbox = resolveSupportInbox();

  // No inbox configured yet (the support address is still a placeholder and no
  // SUPPORT_EMAIL is set): accept the message as a safe no-op rather than failing
  // the parent. This mirrors how sendEmail degrades gracefully with no provider.
  if (!inbox) {
    console.warn(
      "[support] No support inbox is configured (set SUPPORT_EMAIL or fill LEGAL.supportEmail); " +
        "the contact form accepted a message but did not deliver it.",
    );
    return { status: "success", message: SUCCESS_MESSAGE };
  }

  try {
    const { email, message, name } = validation.value;
    await sendEmail({
      to: inbox,
      ...supportRequestEmail({ fromEmail: email, fromName: name, message }),
    });
  } catch (err) {
    console.error("[support] Failed to send the contact form message.", err);
    return { status: "error", message: ERROR_MESSAGE };
  }

  return { status: "success", message: SUCCESS_MESSAGE };
}
