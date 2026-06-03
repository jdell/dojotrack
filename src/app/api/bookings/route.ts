import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { ensureNextSession, getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

interface BookBody {
  /** Book a specific materialised session… */
  classSessionId?: string;
  /** …or the next occurrence of a recurring class. */
  classScheduleId?: string;
  studentId?: string;
}

/**
 * POST /api/bookings — book a student into a class session. Books the next
 * occurrence when only a `classScheduleId` is given. Fills to capacity, then
 * waitlists. Re-booking a previously cancelled spot reuses the same row.
 */
export async function POST(request: Request) {
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

  let body: BookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.studentId) {
    return NextResponse.json(
      { error: "A student is required to book." },
      { status: 400 },
    );
  }

  // Resolve the session to book against.
  let sessionId: string | null = body.classSessionId ?? null;
  if (!sessionId && body.classScheduleId) {
    const sess = await ensureNextSession(body.classScheduleId);
    sessionId = sess?.id ?? null;
  }
  if (!sessionId) {
    return NextResponse.json(
      { error: "No class session specified." },
      { status: 400 },
    );
  }

  try {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        classSchedule: { select: { clubId: true, maxStudents: true } },
      },
    });
    if (!session || session.classSchedule.clubId !== club.id) {
      return NextResponse.json(
        { error: "Class session not found." },
        { status: 404 },
      );
    }

    const student = await prisma.student.findFirst({
      where: { id: body.studentId, clubId: club.id },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Unknown student." },
        { status: 400 },
      );
    }

    const max = session.classSchedule.maxStudents;
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: {
          classSessionId_studentId: {
            classSessionId: sessionId!,
            studentId: student.id,
          },
        },
      });
      if (existing && existing.status !== "CANCELLED") return existing;

      const bookedCount = await tx.booking.count({
        where: { classSessionId: sessionId!, status: "BOOKED" },
      });
      const status = bookedCount < max ? "BOOKED" : "WAITLISTED";

      if (existing) {
        return tx.booking.update({
          where: { id: existing.id },
          data: { status, bookedAt: new Date(), cancelledAt: null },
        });
      }
      return tx.booking.create({
        data: { classSessionId: sessionId!, studentId: student.id, status },
      });
    });

    let waitlistPosition: number | null = null;
    if (booking.status === "WAITLISTED") {
      const ahead = await prisma.booking.count({
        where: {
          classSessionId: sessionId,
          status: "WAITLISTED",
          bookedAt: { lt: booking.bookedAt },
        },
      });
      waitlistPosition = ahead + 1;
    }

    return NextResponse.json({ booking, waitlistPosition }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookings failed", err);
    return NextResponse.json(
      { error: "Could not book the class." },
      { status: 500 },
    );
  }
}

interface CancelBody {
  bookingId?: string;
  classSessionId?: string;
  studentId?: string;
}

/**
 * DELETE /api/bookings — cancel a booking. Identified by `bookingId` or by
 * `(classSessionId, studentId)`. Frees the spot and promotes the first
 * waitlisted student, if any.
 */
export async function DELETE(request: Request) {
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

  let body: CancelBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const where: Prisma.BookingWhereUniqueInput | null = body.bookingId
      ? { id: body.bookingId }
      : body.classSessionId && body.studentId
        ? {
            classSessionId_studentId: {
              classSessionId: body.classSessionId,
              studentId: body.studentId,
            },
          }
        : null;
    if (!where) {
      return NextResponse.json(
        { error: "Specify which booking to cancel." },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where,
      include: {
        classSession: {
          select: {
            id: true,
            classSchedule: { select: { clubId: true, maxStudents: true } },
          },
        },
      },
    });
    if (!booking || booking.classSession.classSchedule.clubId !== club.id) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      // Promote the longest-waiting student if a spot opened up.
      const max = booking.classSession.classSchedule.maxStudents;
      const bookedCount = await tx.booking.count({
        where: { classSessionId: booking.classSession.id, status: "BOOKED" },
      });
      if (bookedCount < max) {
        const next = await tx.booking.findFirst({
          where: {
            classSessionId: booking.classSession.id,
            status: "WAITLISTED",
          },
          orderBy: { bookedAt: "asc" },
        });
        if (next) {
          await tx.booking.update({
            where: { id: next.id },
            data: { status: "BOOKED" },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/bookings failed", err);
    return NextResponse.json(
      { error: "Could not cancel the booking." },
      { status: 500 },
    );
  }
}
