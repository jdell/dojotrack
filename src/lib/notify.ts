/**
 * Outbound WhatsApp notifications via the WhatsApp Business (Meta Graph) API.
 *
 * Configured with `WHATSAPP_API_TOKEN` (a permanent/system-user access token)
 * and `WHATSAPP_PHONE_ID` (the phone number id from the WhatsApp Business
 * account). When either is missing, every send logs to the server console
 * instead — the same gated-fallback pattern as email (`src/lib/email.ts`) and
 * Stripe — so flows stay wired and observable without credentials.
 *
 * Sends never throw: a failed delivery is logged and swallowed so it can't break
 * the request that triggered it (cancelling a class still succeeds if WhatsApp
 * is down).
 *
 * NOTE: import this only from server code (route handlers / server actions).
 */

/** Graph API version pinned for the messages endpoint. */
const GRAPH_VERSION = "v21.0";

export interface Recipient {
  name: string;
  phone: string | null;
}

/** True when both WhatsApp Business credentials are present. */
export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID,
  );
}

/** Normalise a phone number to the digits-only form the Graph API expects. */
function toWaId(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Send one plain-text WhatsApp message, or log it when unconfigured. Returns
 * true if it was accepted by the API (or logged in fallback mode), false on a
 * delivery error.
 */
export async function sendWhatsApp(
  phone: string | null,
  message: string,
): Promise<boolean> {
  if (!phone) {
    console.log(`[whatsapp] (no phone) dropped: ${message}`);
    return false;
  }
  if (!isWhatsAppConfigured()) {
    console.log(`[whatsapp] (unconfigured) → ${phone}: ${message}`);
    return true;
  }
  const phoneId = process.env.WHATSAPP_PHONE_ID!;
  const token = process.env.WHATSAPP_API_TOKEN!;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: toWaId(phone),
          type: "text",
          text: { preview_url: false, body: message },
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[whatsapp] send failed → ${phone}: ${res.status} ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[whatsapp] send error → ${phone}`, err);
    return false;
  }
}

/**
 * Broadcast a message to many recipients. Kept from earlier sprints (used by the
 * class-cancellation and grading-promotion flows); now actually delivers via
 * WhatsApp when configured instead of only logging.
 */
export async function notifyStudents(
  recipients: Recipient[],
  message: string,
): Promise<void> {
  await Promise.all(
    recipients.map((r) =>
      sendWhatsApp(r.phone, `Hi ${r.name.split(" ")[0]}, ${message}`),
    ),
  );
}

// ─── Scheduled / event reminders ─────────────────────────────────────────────
// These build the message copy and delegate to sendWhatsApp. The time-based
// ones (class & payment reminders) are meant to be driven by a daily scheduler
// (e.g. a Vercel Cron hitting a route that queries what's due); the exam one is
// fired in-app when a grading is scheduled.

interface ClassReminderArgs {
  className: string;
  /** e.g. "18:00". */
  startTime: string;
  location?: string | null;
}

/** "Class tomorrow" reminder — intended to run the day before. */
export async function sendClassReminder(
  recipient: Recipient,
  { className, startTime, location }: ClassReminderArgs,
): Promise<boolean> {
  const where = location ? ` at ${location}` : "";
  return sendWhatsApp(
    recipient.phone,
    `Hi ${recipient.name.split(" ")[0]}, reminder: ${className} is tomorrow at ${startTime}${where}. See you on the mats! 🥋`,
  );
}

interface PaymentDueArgs {
  amount: number;
  currency?: string;
  /** Human-readable due date, e.g. "June 1". */
  dueDate: string;
  clubName: string;
}

/** Payment-due reminder — intended to run a few days before the due date. */
export async function sendPaymentDueReminder(
  recipient: Recipient,
  { amount, currency = "usd", dueDate, clubName }: PaymentDueArgs,
): Promise<boolean> {
  const formatted = `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  return sendWhatsApp(
    recipient.phone,
    `Hi ${recipient.name.split(" ")[0]}, your ${clubName} membership payment of ${formatted} is due on ${dueDate}. Thanks for keeping your training going!`,
  );
}

interface BeltExamArgs {
  beltName: string;
  /** Human-readable exam date, e.g. "June 15". */
  date: string;
  location?: string | null;
}

/** Belt-exam-scheduled notice — fired when a grading is created. */
export async function sendBeltExamScheduled(
  recipient: Recipient,
  { beltName, date, location }: BeltExamArgs,
): Promise<boolean> {
  const where = location ? ` at ${location}` : "";
  return sendWhatsApp(
    recipient.phone,
    `Hi ${recipient.name.split(" ")[0]}, you've been entered for your ${beltName} grading on ${date}${where}. Train hard and good luck! 🥋`,
  );
}
