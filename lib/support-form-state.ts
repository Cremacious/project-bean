// lib/support-form-state.ts
//
// The contact form's state shape and initial value (issue #72), kept in a plain
// module because a "use server" file (lib/support-actions.ts) may only export
// async functions, never a runtime value like the initial state. Both the server
// action and the client form import from here.
import type { SupportField } from "@/lib/support";

export type SupportFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; field?: SupportField };

export const SUPPORT_INITIAL_STATE: SupportFormState = { status: "idle" };
