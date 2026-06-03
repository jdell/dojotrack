/**
 * Transactional email via Resend.
 *
 * Mirrors the other "is X configured?" gates (see `src/lib/stripe.ts`): email is
 * only actually delivered when `RESEND_API_KEY` is set. When it isn't, every
 * send logs the rendered subject/recipient to the server console instead — the
 * same fallback pattern as WhatsApp (`src/lib/notify.ts`), so the surrounding
 * flows stay wired end-to-end and observable without an API key.
 *
 * NOTE: import this only from server code (route handlers / server actions).
 */
import { Resend } from "resend";
import { BRAND, COLORS } from "./constants";
import { formatMoney } from "./utils";

/** True when a Resend API key is present in the environment. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** From address for outbound mail. Override with `RESEND_FROM`. */
function fromAddress(): string {
  // Resend's onboarding sender works out of the box for testing; production
  // should set RESEND_FROM to a verified domain sender.
  return process.env.RESEND_FROM ?? `${BRAND.name} <onboarding@resend.dev>`;
}

const globalForResend = globalThis as unknown as { resend?: Resend };

/** Lazily-created Resend client, reused across hot-reloads. Null when unset. */
function getResend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!globalForResend.resend) {
    globalForResend.resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return globalForResend.resend;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send one email, or log it when Resend isn't configured. Never throws — a
 * failed send is logged and swallowed so it can't break the request flow that
 * triggered it (an invite still succeeds even if the email bounces).
 */
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[email] (unconfigured) → ${to}: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: fromAddress(), to, subject, html });
  } catch (err) {
    console.error(`[email] send failed → ${to}: ${subject}`, err);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────
// Plain, inline-styled HTML so it renders consistently across mail clients.

/** Wrap body content in the branded DojoTrack email shell. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:${COLORS.navy};padding:24px 28px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;">Dojo<span style="color:${COLORS.gold};">Track</span></span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:${COLORS.navy};">${heading}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              ${BRAND.name} — ${BRAND.tagline}
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** A teal call-to-action button. */
function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${COLORS.teal};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">${label}</a>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface InvitationEmailArgs {
  to: string;
  clubName: string;
  inviteLink: string;
  recipientName?: string | null;
}

/** Invite someone to join a club. */
export async function sendInvitationEmail(
  args: InvitationEmailArgs,
): Promise<void> {
  const { to, clubName, inviteLink, recipientName } = args;
  const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : "Hi there,";
  const club = escapeHtml(clubName);
  const html = layout(`You're invited to join ${club}`, `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      <strong>${club}</strong> uses ${BRAND.name} to manage classes, belt
      progression and payments. Tap below to set up your student profile — it
      only takes a minute.
    </p>
    <p style="margin:0 0 24px;">${button(inviteLink, "Join the club")}</p>
    <p style="margin:0;font-size:13px;color:#64748b;">
      Or paste this link into your browser:<br/>
      <a href="${inviteLink}" style="color:${COLORS.teal};word-break:break-all;">${inviteLink}</a>
    </p>`);
  await sendEmail({ to, subject: `Join ${clubName} on ${BRAND.name}`, html });
}

interface PaymentReceiptEmailArgs {
  to: string;
  clubName: string;
  studentName: string;
  amount: number;
  currency?: string;
  description?: string | null;
  /** ISO date the payment was made. */
  paidAt?: string | null;
}

/** Confirm a successful payment. */
export async function sendPaymentReceiptEmail(
  args: PaymentReceiptEmailArgs,
): Promise<void> {
  const { to, clubName, studentName, amount, currency, description, paidAt } =
    args;
  const club = escapeHtml(clubName);
  const money = formatMoney(amount, currency ?? "usd");
  const when = paidAt
    ? new Date(paidAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const html = layout("Payment received", `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Thanks, ${escapeHtml(studentName)} — we've received your payment to
      <strong>${club}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:10px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">Amount</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;text-align:right;">${money}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">Description</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:right;">${escapeHtml(description ?? "Membership")}</td></tr>
      <tr><td style="padding:12px 16px;font-size:14px;color:#64748b;">Date</td>
          <td style="padding:12px 16px;font-size:14px;text-align:right;">${when}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">Keep this email as your receipt.</p>`);
  await sendEmail({
    to,
    subject: `Your ${clubName} payment receipt — ${money}`,
    html,
  });
}

interface ExamResultEmailArgs {
  to: string;
  clubName: string;
  studentName: string;
  beltName: string;
  passed: boolean;
  /** ISO date of the grading exam. */
  examDate?: string | null;
}

/** Notify a candidate of their grading exam result. */
export async function sendExamResultEmail(
  args: ExamResultEmailArgs,
): Promise<void> {
  const { to, clubName, studentName, beltName, passed } = args;
  const club = escapeHtml(clubName);
  const belt = escapeHtml(beltName);
  const headline = passed
    ? `Congratulations — you passed!`
    : `Your grading result`;
  const body = passed
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
         Congratulations, ${escapeHtml(studentName)}! You've been promoted to
         <strong>${belt}</strong> at ${club}. 🥋
       </p>
       <p style="margin:0;font-size:15px;line-height:1.6;">
         Your instructors are proud of the work you put in — keep it up.
       </p>`
    : `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
         Hi ${escapeHtml(studentName)}, thanks for testing for <strong>${belt}</strong>
         at ${club}. You didn't pass this time, but every grading is a step
         forward.
       </p>
       <p style="margin:0;font-size:15px;line-height:1.6;">
         Your instructors will share feedback and the areas to focus on before
         your next attempt.
       </p>`;
  const html = layout(headline, body);
  await sendEmail({
    to,
    subject: passed
      ? `You passed — welcome to ${beltName}!`
      : `Your ${clubName} grading result`,
    html,
  });
}
