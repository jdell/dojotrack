import { BRAND } from "./constants";

/** Public base URL for shareable links (falls back to the brand URL). */
export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_URL ?? BRAND.url).replace(/\/$/, "");
}

/** The public join URL for an invitation token. */
export function inviteLink(token: string): string {
  return `${baseUrl()}/join/${token}`;
}

/** Pre-filled WhatsApp share text + click-to-share URL for an invite. */
export function whatsappShare(clubName: string, token: string) {
  const link = inviteLink(token);
  const text = `Join ${clubName} on ${BRAND.name}: ${link}`;
  return {
    link,
    whatsappText: text,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(text)}`,
  };
}
