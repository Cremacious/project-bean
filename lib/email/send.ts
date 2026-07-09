// lib/email/send.ts
// The single outbound path for transactional email. Sends through Resend when
// RESEND_API_KEY and EMAIL_FROM are set; otherwise logs the message (link
// included) to the server console so the auth flows stay testable in local dev
// without a provider. See docs/WORKFLOW.md and issue #17.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** A fully rendered message ready to hand to the provider. */
export type OutgoingEmail = { to: string; subject: string; html: string; text: string };

/**
 * Sends one email. Resolves on success. Rejects only when a configured
 * provider actively fails, so a missing key never breaks sign-up or reset;
 * it just logs instead.
 */
export async function sendEmail(email: OutgoingEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      `[email] RESEND_API_KEY or EMAIL_FROM is not set, so this email was not delivered. ` +
        `Logging it instead so you can follow the link locally:\n` +
        `  To: ${email.to}\n  Subject: ${email.subject}\n\n${email.text}\n`,
    );
    return;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email send failed with status ${res.status}. ${detail}`.trim());
  }
}
