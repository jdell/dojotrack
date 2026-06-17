/**
 * Transactional email via Resend.
 *
 * Mirrors the other "is X configured?" gates (see `src/lib/stripe.ts`): email is
 * only actually delivered when `RESEND_API_KEY` is set. When it isn't, every
 * send logs the rendered subject/recipient to the server console instead — the
 * same fallback pattern as WhatsApp (`src/lib/notify.ts`), so the surrounding
 * flows stay wired and observable without an API key.
 *
 * Localised: every template is rendered in the club's preferred language
 * (`Club.locale`, captured at registration — falls back to English). The copy
 * comes from the `Email` namespace in `messages/<locale>.json` via next-intl's
 * `getTranslations`, which works in route handlers with an explicit locale.
 *
 * NOTE: import this only from server code (route handlers / server actions).
 */
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { BRAND, COLORS } from "./constants";
import { formatMoney } from "./utils";
import { routing } from "@/i18n/routing";

/** True when a Resend API key is present in the environment. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Normalise a possibly-null locale to a supported one (defaults per routing). */
function resolveLocale(locale: string | null | undefined): string {
  return locale && (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
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

/** Wrap body content in the branded EntrenaDojo email shell. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:${COLORS.navy};padding:24px 28px;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;">Entrena<span style="color:${COLORS.gold};">Dojo</span></span>
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
  /** The club's preferred language; defaults to English. */
  locale?: string | null;
}

/** Invite someone to join a club. */
export async function sendInvitationEmail(
  args: InvitationEmailArgs,
): Promise<void> {
  const { to, clubName, inviteLink, recipientName } = args;
  const t = await getTranslations({
    locale: resolveLocale(args.locale),
    namespace: "Email",
  });
  const club = escapeHtml(clubName);
  const greeting = recipientName
    ? t("invitationGreetingNamed", { name: escapeHtml(recipientName) })
    : t("invitationGreeting");
  const html = layout(t("invitationHeading", { club }), `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      ${t("invitationBody", { club: `<strong>${club}</strong>` })}
    </p>
    <p style="margin:0 0 24px;">${button(inviteLink, t("invitationButton"))}</p>
    <p style="margin:0;font-size:13px;color:#64748b;">
      ${t("invitationOrPaste")}<br/>
      <a href="${inviteLink}" style="color:${COLORS.teal};word-break:break-all;">${inviteLink}</a>
    </p>`);
  await sendEmail({
    to,
    subject: t("invitationSubject", { club: clubName }),
    html,
  });
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
  locale?: string | null;
}

/** Confirm a successful payment. */
export async function sendPaymentReceiptEmail(
  args: PaymentReceiptEmailArgs,
): Promise<void> {
  const { to, clubName, studentName, amount, currency, description, paidAt } =
    args;
  const locale = resolveLocale(args.locale);
  const t = await getTranslations({ locale, namespace: "Email" });
  const club = escapeHtml(clubName);
  const money = formatMoney(amount, currency ?? "usd");
  const when = paidAt
    ? new Date(paidAt).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const html = layout(t("receiptHeading"), `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      ${t("receiptBody", { name: escapeHtml(studentName), club: `<strong>${club}</strong>` })}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:10px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">${t("receiptAmount")}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;text-align:right;">${money}</td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;">${t("receiptDescription")}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;text-align:right;">${escapeHtml(description ?? "Membership")}</td></tr>
      <tr><td style="padding:12px 16px;font-size:14px;color:#64748b;">${t("receiptDate")}</td>
          <td style="padding:12px 16px;font-size:14px;text-align:right;">${when}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#64748b;">${t("receiptKeep")}</p>`);
  await sendEmail({
    to,
    subject: t("receiptSubject", { club: clubName, amount: money }),
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
  locale?: string | null;
}

/** Notify a candidate of their grading exam result. */
export async function sendExamResultEmail(
  args: ExamResultEmailArgs,
): Promise<void> {
  const { to, clubName, studentName, beltName, passed } = args;
  const t = await getTranslations({
    locale: resolveLocale(args.locale),
    namespace: "Email",
  });
  const club = escapeHtml(clubName);
  const belt = escapeHtml(beltName);
  const name = escapeHtml(studentName);
  const body = passed
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
         ${t("examPassedBody", { name, belt: `<strong>${belt}</strong>`, club })}
       </p>
       <p style="margin:0;font-size:15px;line-height:1.6;">${t("examPassedBody2")}</p>`
    : `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
         ${t("examFailBody", { name, belt: `<strong>${belt}</strong>`, club })}
       </p>
       <p style="margin:0;font-size:15px;line-height:1.6;">${t("examFailBody2")}</p>`;
  const html = layout(
    passed ? t("examPassedHeading") : t("examResultHeading"),
    body,
  );
  await sendEmail({
    to,
    subject: passed
      ? t("examPassedSubject", { belt: beltName })
      : t("examResultSubject", { club: clubName }),
    html,
  });
}
