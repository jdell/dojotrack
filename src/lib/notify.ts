/**
 * Outbound notifications.
 *
 * WhatsApp delivery (the intended channel) lands in a later sprint — for now
 * these helpers just log so the surrounding flows (e.g. cancelling a session)
 * are wired end-to-end and observable in the server output.
 */

interface Recipient {
  name: string;
  phone: string | null;
}

/** Log a would-be WhatsApp message to each recipient. */
export function notifyStudents(recipients: Recipient[], message: string): void {
  for (const r of recipients) {
    console.log(
      `[notify] → ${r.name} <${r.phone ?? "no phone"}>: ${message}`,
    );
  }
}
