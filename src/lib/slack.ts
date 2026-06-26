const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function notifySlack(text: string): Promise<void> {
  if (!WEBHOOK_URL) {
    console.log("[slack]", text);
    return;
  }
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("[slack] notification failed:", err);
  }
}
