// lib/email/templates.ts
// On-brand, dash-free HTML email templates for Bedtime Quests.
//
// Colors are literal Paper Cut hex (mirrored from app/globals.css), NOT CSS
// variables, so every email client renders them identically. This matches the
// approach used for the brand icon art (see docs/WORKFLOW.md).
//
// App-wide UI rule: no dashes as punctuation in any displayed copy. (CSS
// property names like "font-family" are code, not copy, and are fine.)

/** Literal Paper Cut palette, kept in sync with app/globals.css. */
const COLOR = {
  navy: "#16283A",
  cream: "#FFF1DC",
  plum: "#6C5CE7",
  plumInk: "#574BC0",
  ink: "#16283A",
  sub: "#5A7089",
  line: "#D4E3F2",
  white: "#FFFFFF",
} as const;

/** A ready to send email: the subject plus HTML and plain text bodies. */
export type EmailContent = { subject: string; html: string; text: string };

/** Escapes the five HTML-significant characters so user values render safely. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Wraps body markup in the shared Bedtime Quests shell: a deep navy night sky
 * with a cream card, so every transactional email looks like the app.
 */
function shell({ preview, bodyHtml }: { preview: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${COLOR.navy};">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.navy};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLOR.cream};border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:20px;font-weight:800;color:${COLOR.ink};letter-spacing:-0.2px;">Bedtime Quests</div>
                <div style="font-size:13px;font-weight:600;color:${COLOR.sub};margin-top:2px;">Interactive Stories for Kids</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:${COLOR.ink};">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <div style="max-width:480px;margin:16px auto 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${COLOR.line};text-align:center;">
            Bedtime Quests
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** A chunky, plainly clickable Paper Cut style button for email bodies. */
function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${COLOR.plum};color:${COLOR.white};font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;border-radius:14px;border-bottom:4px solid ${COLOR.plumInk};">${escapeHtml(label)}</a>`;
}

/**
 * The password reset email. BetterAuth generates the tokenised `url`; we only
 * render it. `name` is the parent's display name when we have one.
 */
export function resetPasswordEmail({ name, url }: { name?: string | null; url: string }): EmailContent {
  const trimmed = name?.trim();
  const greeting = trimmed ? `Hi ${trimmed},` : "Hi there,";
  const subject = "Reset your Bedtime Quests password";
  const preview = "Here is your secure link to set a new password.";

  const bodyHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 24px;">We got a request to set a new password for your Bedtime Quests account. Tap the button below to choose a new one.</p>
    <p style="margin:0 0 24px;">${button(url, "Reset password")}</p>
    <p style="margin:0 0 20px;color:${COLOR.sub};font-size:14px;">This link works for one hour. If you did not ask to reset your password, you can safely ignore this email and nothing will change.</p>
    <p style="margin:0;color:${COLOR.sub};font-size:13px;word-break:break-all;">If the button does not work, copy and paste this link into your browser:<br /><a href="${url}" style="color:${COLOR.plumInk};">${escapeHtml(url)}</a></p>
  `;

  const text = [
    greeting,
    "",
    "We got a request to set a new password for your Bedtime Quests account.",
    "Open this link to choose a new one:",
    url,
    "",
    "This link works for one hour. If you did not ask to reset your password, you can safely ignore this email and nothing will change.",
    "",
    "Bedtime Quests",
  ].join("\n");

  return { subject, html: shell({ preview, bodyHtml }), text };
}

/**
 * The support request email (issue #72). Sent to our own support inbox when a
 * parent submits the Help page contact form, so it is an internal notification
 * rather than a message to the parent. The parent's own address and name are
 * shown (and escaped) so we can reply, and the message is preserved with its line
 * breaks. Warm, plain, and dash free.
 */
export function supportRequestEmail({
  fromEmail,
  fromName,
  message,
}: {
  fromEmail: string;
  fromName?: string | null;
  message: string;
}): EmailContent {
  const trimmedName = fromName?.trim();
  const who = trimmedName ? `${trimmedName} (${fromEmail})` : fromEmail;
  const subject = "New support message from a parent";
  const preview = `From ${who}`;

  // Preserve the parent's line breaks in the HTML view after escaping.
  const messageHtml = escapeHtml(message).replace(/\n/g, "<br />");

  const bodyHtml = `
    <p style="margin:0 0 8px;font-weight:700;">New support message</p>
    <p style="margin:0 0 4px;color:${COLOR.sub};font-size:14px;">From: ${escapeHtml(who)}</p>
    <p style="margin:0 0 16px;color:${COLOR.sub};font-size:14px;">Reply to: <a href="mailto:${escapeHtml(fromEmail)}" style="color:${COLOR.plumInk};">${escapeHtml(fromEmail)}</a></p>
    <div style="margin:0;padding:16px;background:${COLOR.white};border-radius:14px;border:1px solid ${COLOR.line};">${messageHtml}</div>
  `;

  const text = [
    "New support message",
    `From: ${who}`,
    `Reply to: ${fromEmail}`,
    "",
    message,
    "",
    "Bedtime Quests",
  ].join("\n");

  return { subject, html: shell({ preview, bodyHtml }), text };
}

/**
 * The marketing waitlist confirmation email (issue #68). Sent best effort when a
 * parent joins the launch list on /welcome. `name` is their first name when they
 * gave one. Warm, short, and dash free.
 */
export function waitlistConfirmationEmail({ name }: { name?: string | null }): EmailContent {
  const trimmed = name?.trim();
  const greeting = trimmed ? `Hi ${trimmed},` : "Hi there,";
  const subject = "You are on the Bedtime Quests list";
  const preview = "Thanks for joining. We will let you know the moment we launch.";

  const bodyHtml = `
    <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;">Thanks for joining the Bedtime Quests waitlist. You are on the list, and we will email you the moment we launch.</p>
    <p style="margin:0 0 16px;">Bedtime Quests turns story time into a ritual you build together. You read aloud, your little one chooses what happens next, and their name is woven right into the tale.</p>
    <p style="margin:0;color:${COLOR.sub};font-size:14px;">If you did not sign up for this, you can safely ignore this email and we will not contact you again.</p>
  `;

  const text = [
    greeting,
    "",
    "Thanks for joining the Bedtime Quests waitlist. You are on the list, and we will email you the moment we launch.",
    "",
    "Bedtime Quests turns story time into a ritual you build together. You read aloud, your little one chooses what happens next, and their name is woven right into the tale.",
    "",
    "If you did not sign up for this, you can safely ignore this email and we will not contact you again.",
    "",
    "Bedtime Quests",
  ].join("\n");

  return { subject, html: shell({ preview, bodyHtml }), text };
}
