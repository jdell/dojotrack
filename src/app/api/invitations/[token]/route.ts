import { NextResponse } from "next/server";
import type { Student, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthContext } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ token: string }> };

type AcceptOutcome =
  | { ok: false; reason: "not_found" | "accepted" | "expired" | "auth_required" }
  | { ok: true; student: Student }
  | { ok: true; user: User };

/**
 * GET /api/invitations/[token] — validate an invite token. Returns the club it
 * belongs to and a status of "valid", "accepted", "expired", or "not_found".
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params;

  if (!isDbConfigured()) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { club: { select: { name: true, slug: true } } },
    });

    if (!invitation) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({ status: "accepted" }, { status: 410 });
    }

    const expired =
      invitation.status === "EXPIRED" ||
      (invitation.expiresAt !== null && invitation.expiresAt < new Date());
    if (expired) {
      return NextResponse.json({ status: "expired" }, { status: 410 });
    }

    return NextResponse.json({
      status: "valid",
      club: invitation.club,
      unitLabel: invitation.unitLabel,
      role: invitation.role,
    });
  } catch (err) {
    console.error("GET /api/invitations/[token] failed", err);
    return NextResponse.json(
      { status: "error", error: "Could not validate the invite." },
      { status: 500 },
    );
  }
}

interface AcceptBody {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
}

/**
 * POST /api/invitations/[token] — accept an invite: create the student in the
 * club and mark the invitation as used. Idempotency is enforced by re-checking
 * the invitation's status inside a transaction.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { token } = await params;

  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }

  let body: AcceptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const fullName = body.fullName?.trim();
  if (!fullName) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx): Promise<AcceptOutcome> => {
        const invitation = await tx.invitation.findUnique({ where: { token } });
        if (!invitation) return { ok: false, reason: "not_found" };

        const expired =
          invitation.status === "EXPIRED" ||
          (invitation.expiresAt !== null && invitation.expiresAt < new Date());
        if (invitation.status === "ACCEPTED")
          return { ok: false, reason: "accepted" };
        if (expired) return { ok: false, reason: "expired" };

        // Staff invitations (ADMIN or INSTRUCTOR) require an authenticated user.
        if (invitation.role === "ADMIN" || invitation.role === "INSTRUCTOR") {
          const ctx = await getAuthContext();
          if (!ctx) return { ok: false, reason: "auth_required" };

          // Update the existing user's role and club.
          const user = await tx.user.update({
            where: { id: ctx.user.id },
            data: {
              role: invitation.role,
              clubId: invitation.clubId,
              fullName: fullName || ctx.user.fullName,
            },
          });
          await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED" },
          });
          return { ok: true, user };
        }

        // Student invitations — create a Student record (no auth needed).
        const student = await tx.student.create({
          data: {
            clubId: invitation.clubId,
            fullName,
            phone: body.phone || null,
            email: body.email || null,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          },
        });
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });
        return { ok: true, student };
      },
    );

    if (!result.ok) {
      const map = {
        not_found: { msg: "This invite link is invalid.", code: 404 },
        accepted: { msg: "This invite has already been used.", code: 410 },
        expired: { msg: "This invite has expired.", code: 410 },
        auth_required: { msg: "Staff invitations require you to be logged in. Please sign in first.", code: 401 },
      } as const;
      const { msg, code } = map[result.reason];
      return NextResponse.json({ error: msg }, { status: code });
    }

    if ("user" in result) {
      return NextResponse.json({ user: result.user }, { status: 201 });
    }
    return NextResponse.json({ student: result.student }, { status: 201 });
  } catch (err) {
    console.error("POST /api/invitations/[token] failed", err);
    return NextResponse.json(
      { error: "Could not complete sign-up." },
      { status: 500 },
    );
  }
}
