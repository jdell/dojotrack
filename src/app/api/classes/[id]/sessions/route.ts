import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { ensureSession } from "@/lib/queries";
import { nextOccurrences, startOfDay } from "@/lib/schedule";

type RouteContext = { params: Promise<{ id: string }> };

/** How many upcoming occurrences to surface. */
const UPCOMING = 8;

/**
 * GET /api/classes/[id]/sessions — the next upcoming sessions for a class,
 * materialised so each carries a stable id, with enrolled and check-in counts.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ sessions: [] });
  }

  const schedule = await prisma.classSchedule.findUnique({
    where: { id },
    select: { id: true, dayOfWeek: true, startTime: true, maxStudents: true },
  });
  if (!schedule) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  try {
    const dates = nextOccurrences(
      schedule.dayOfWeek,
      schedule.startTime,
      UPCOMING,
    );
    await Promise.all(dates.map((d) => ensureSession(schedule.id, d)));

    const sessions = await prisma.classSession.findMany({
      where: { classScheduleId: id, date: { gte: startOfDay(new Date()) } },
      orderBy: { date: "asc" },
      take: UPCOMING,
      include: {
        _count: { select: { attendances: true } },
        bookings: { where: { status: "BOOKED" }, select: { id: true } },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        cancelled: s.cancelled,
        cancelReason: s.cancelReason,
        maxStudents: schedule.maxStudents,
        enrolledCount: s.bookings.length,
        checkedInCount: s._count.attendances,
      })),
    });
  } catch (err) {
    console.error("GET /api/classes/[id]/sessions failed", err);
    return NextResponse.json(
      { error: "Could not load sessions." },
      { status: 500 },
    );
  }
}
