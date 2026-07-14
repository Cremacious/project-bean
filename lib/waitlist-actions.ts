"use server";
//
// lib/waitlist-actions.ts
//
// The "use server" seam the /welcome waitlist form calls (issue #68). It is used
// with React's useActionState, so its signature is (prevState, formData) and it
// returns the next form state. The actual validation + persistence lives in
// lib/waitlist.ts; this wrapper reads the form, applies a spam honeypot, and maps
// the result to warm, dash free copy for the UI.
//
// Security: Server Actions are reachable by direct POST, so all validation runs
// server side in addToWaitlist rather than trusting the caller.
//
// A "use server" file may only export async functions, so the form state shape
// and its initial value live in lib/waitlist-form-state.ts, not here.
import { addToWaitlist } from "@/lib/waitlist";
import type { WaitlistFormState } from "@/lib/waitlist-form-state";

// Shown when the signup lands (whether brand new or already on the list). The
// wording differs slightly so a returning parent is reassured, not re-thanked.
const ADDED_MESSAGE = "You are on the list. We will email you the moment we launch.";
const ALREADY_MESSAGE = "You are already on the list. We will be in touch at launch.";
const INVALID_EMAIL_MESSAGE = "That email does not look right. Please check for typos.";
const ERROR_MESSAGE = "Something went wrong on our end. Please try again in a moment.";

export async function joinWaitlist(
  _prevState: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  // Honeypot: a hidden field a real parent never sees or fills. If a bot fills
  // it, report success without storing or emailing anything, so the bot gets no
  // signal that it was rejected.
  const trap = (formData.get("company") ?? "").toString();
  if (trap.trim()) {
    return { status: "success", alreadyOnList: false, message: ADDED_MESSAGE };
  }

  const email = (formData.get("email") ?? "").toString();
  const name = (formData.get("name") ?? "").toString();

  const result = await addToWaitlist({ email, name, source: "welcome" });

  if (!result.ok) {
    if (result.reason === "invalid_email") {
      return { status: "error", field: "email", message: INVALID_EMAIL_MESSAGE };
    }
    return { status: "error", message: ERROR_MESSAGE };
  }

  return result.status === "already_on_list"
    ? { status: "success", alreadyOnList: true, message: ALREADY_MESSAGE }
    : { status: "success", alreadyOnList: false, message: ADDED_MESSAGE };
}
