// lib/waitlist-form-state.ts
//
// The waitlist form's state shape and its initial value, kept in a plain module.
// This is deliberately NOT in lib/waitlist-actions.ts because a "use server" file
// may only export async functions, never a runtime value like the initial state.
// Both the server action and the client form import from here.
export type WaitlistFormState =
  | { status: "idle" }
  | { status: "success"; message: string; alreadyOnList: boolean }
  | { status: "error"; message: string; field?: "email" };

export const WAITLIST_INITIAL_STATE: WaitlistFormState = { status: "idle" };
