// lib/admin-auth-state.ts
//
// The form-state shape for the /admin login action, kept out of the "use server"
// file (which may only export async functions). Used with React's useActionState.
export type AdminLoginState = { status: "idle" | "error"; message?: string };

export const ADMIN_LOGIN_INITIAL: AdminLoginState = { status: "idle" };
