import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";
import { notifyStudents } from "@/lib/notify";
import { formatDate } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

interface PatchBody {
  cancelled?: boolean;
  cancelReason?: string | null;
}

/**
 * PATCH /api/sessions/[id] — cancel (or reinstate) a single class session
 * without touching the recurring schedule. Cancelling notifies every booked
 * student (WhatsApp delivery is stubbed in `notifyStudents` for now).
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const session = await prisma.classSession.findUnique({
    where: { id },
    include: {
      classSchedule: { select: { clubId: true, name: true } },
      bookings: {
        where: { status: { in: ["BOOKED", "WAITLISTED"] } },
        include: { student: { select: { fullName: true, phone: true } } },
      },
    },
  });
  if (!session || session.classSchedule.clubId !== club.id) {
    return NextResponse.json(
      { error: "Class session not found." },
      { status: 404 },
    );
  }

  const cancelled = Boolean(body.cancelled);

  try {
    const updated = await prisma.classSession.update({
      where: { id },
      data: {
        cancelled,
        cancelReason: cancelled ? body.cancelReason?.trim() || null : null,
      },
    });

    if (cancelled) {
      const when = formatDate(session.date.toISOString());
      const reason = body.cancelReason?.trim();
      const message =
        `${session.classSchedule.name} on ${when} has been cancelled.` +
        (reason ? ` Reason: ${reason}` : "");
      notifyStudents(
        session.bookings.map((b) => ({
          name: b.student.fullName,
          phone: b.student.phone,
        })),
        message,
      );
    }

    return NextResponse.json({
      session: updated,
      notified: cancelled ? session.bookings.length : 0,
    });
  } catch (err) {
    console.error("PATCH /api/sessions/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the session." },
      { status: 500 },
    );
  }
}
