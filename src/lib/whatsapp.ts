/**
 * WhatsApp Business API client — template message support.
 *
 * For plain-text messages, see `src/lib/notify.ts` which uses the text
 * endpoint directly. This module adds template-message support required by
 * WhatsApp for business-initiated conversations.
 *
 * NOTE: import only from server code.
 */

const GRAPH_VERSION = "v21.0";

export { isWhatsAppConfigured } from "./notify";

/**
 * Send a template message via the WhatsApp Business API.
 * Template messages are required for business-initiated conversations
 * (i.e. sending a message to someone who hasn't messaged you first in 24h).
 *
 * Falls back to console logging when credentials are not configured.
 */
export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  params: string[],
): Promise<void> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.log(
      `[whatsapp] (unconfigured) template → ${to}: ${templateName}(${params.join(", ")})`,
    );
    return;
  }

  const waId = to.replace(/[^\d]/g, "");

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
          to: waId,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: params.length
              ? [
                  {
                    type: "body",
                    parameters: params.map((p) => ({
                      type: "text",
                      text: p,
                    })),
                  },
                ]
              : [],
          },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[whatsapp] template send failed → ${to}: ${res.status} ${detail}`,
      );
    }
  } catch (err) {
    console.error(`[whatsapp] template send error → ${to}`, err);
  }
}
