// lib/email/index.ts
// Public surface of the transactional email module (issue #17).
export { sendEmail } from "./send";
export type { OutgoingEmail } from "./send";
export { resetPasswordEmail } from "./templates";
export type { EmailContent } from "./templates";
