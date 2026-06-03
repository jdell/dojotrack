import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { whatsappShare } from "@/lib/invite";

/** Invitations stay valid for two weeks. */
const INVITE_TTL_DAYS = 14;

/** GET /api/invitations — list the current club's pending invitations. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ invitations: [] });
  }
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ invitations: [] });
  }
  try {
    const invitations = await prisma.invitation.findMany({
      where: { clubId: club.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    const enriched = invitations.map((inv) => ({
      ...inv,
      ...whatsappShare(club.name, inv.token),
    }));
    return NextResponse.json({ invitations: enriched });
  } catch (err) {
    console.error("GET /api/invitations failed", err);
    return NextResponse.json(
      { error: "Could not load invitations." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/invitations — create a single-use invite for the current club and
 * return its shareable link + WhatsApp share URL.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json(
      { error: "No club found. Create a club before inviting members." },
      { status: 400 },
    );
  }

  let unitLabel: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    unitLabel = body?.unitLabel?.trim() || null;
  } catch {
    // Body is optional — ignore parse errors.
  }

  try {
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);
    const invitation = await prisma.invitation.create({
      data: { clubId: club.id, unitLabel, expiresAt },
    });
    return NextResponse.json(
      { invitation, ...whatsappShare(club.name, invitation.token) },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/invitations failed", err);
    return NextResponse.json(
      { error: "Could not create the invitation." },
      { status: 500 },
    );
  }
}
