import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";

interface TrialRequestBody {
  clubSlug: string;
  classScheduleId?: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
}

export async function POST(request: Request) {
  let body: TrialRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!body.email?.trim() && !body.phone?.trim()) {
    return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
  }

  // Look up the club to get its email
  let clubEmail: string | null = null;
  let clubName = "Unknown club";
  let className: string | null = null;

  if (isDbConfigured()) {
    try {
      const club = await prisma.club.findUnique({
        where: { slug: body.clubSlug },
        select: { email: true, name: true },
      });
      if (club) {
        clubEmail = club.email;
        clubName = club.name;
      }

      if (body.classScheduleId) {
        const cs = await prisma.classSchedule.findUnique({
          where: { id: body.classScheduleId },
          select: { name: true },
        });
        className = cs?.name ?? null;
      }
    } catch {
      // fall through
    }
  }

  // Build a notification message
  const lines = [
    `New trial class request for ${clubName}`,
    `Name: ${body.name}`,
    body.email ? `Email: ${body.email}` : null,
    body.phone ? `Phone: ${body.phone}` : null,
    className ? `Class: ${className}` : null,
    body.message ? `Message: ${body.message}` : null,
  ].filter(Boolean);

  // If Resend is configured and club has an email, send notification
  if (isEmailConfigured() && clubEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const from = process.env.RESEND_FROM ?? "EntrenaDojo <onboarding@resend.dev>";
      await resend.emails.send({
        from,
        to: clubEmail,
        subject: `Trial class request from ${body.name}`,
        html: `<div style="font-family:sans-serif;max-width:500px">
          <h2 style="color:#0d3b66">New trial class request</h2>
          <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
          ${body.email ? `<p><strong>Email:</strong> ${escapeHtml(body.email)}</p>` : ""}
          ${body.phone ? `<p><strong>Phone:</strong> ${escapeHtml(body.phone)}</p>` : ""}
          ${className ? `<p><strong>Class:</strong> ${escapeHtml(className)}</p>` : ""}
          ${body.message ? `<p><strong>Message:</strong> ${escapeHtml(body.message)}</p>` : ""}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
          <p style="color:#94a3b8;font-size:12px">Sent via EntrenaDojo</p>
        </div>`,
      });
    } catch (err) {
      console.error("Failed to send trial request email:", err);
    }
  } else {
    // Log to console as fallback
    console.log("--- Trial class request ---");
    console.log(lines.join("\n"));
    console.log("---");
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
