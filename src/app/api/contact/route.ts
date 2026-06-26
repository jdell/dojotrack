import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/constants";

/**
 * In-memory rate limiter: max 5 submissions per IP per hour.
 * Map key = IP address, value = array of timestamps (ms).
 */
const submissions = new Map<string, number[]>();
const MAX_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const history = (submissions.get(ip) ?? []).filter(
    (ts) => now - ts < WINDOW_MS,
  );
  if (history.length >= MAX_PER_HOUR) {
    submissions.set(ip, history);
    return true;
  }
  history.push(now);
  submissions.set(ip, history);
  return false;
}

export async function POST(request: Request) {
  // Resolve IP from headers (async in this Next.js version)
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: { name?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { name, email, message } = body;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !message?.trim()
  ) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 },
    );
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 },
    );
  }

  const sanitize = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    await sendEmail({
      to: "hola@entrenadojo.es",
      subject: `[${BRAND.name}] Contact form: ${name.trim()}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${sanitize(name.trim())}</p>
        <p><strong>Email:</strong> ${sanitize(email.trim())}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitize(message.trim()).replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}
