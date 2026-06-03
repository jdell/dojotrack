import QRCode from "qrcode";

/**
 * Render a string as a QR code data URL (PNG) for inline `<img>` display.
 * Used to encode self-check-in links. Returns null if generation fails so the
 * caller can fall back to showing the raw URL.
 */
export async function qrDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      width: 220,
      margin: 1,
      color: { dark: "#1e3a5f", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}
