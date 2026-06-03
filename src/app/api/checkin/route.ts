import { NextResponse } from "next/server";
import type { CheckinMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { ensureNextSession, getCurrentClub } from "@/lib/queries";

const METHODS: CheckinMethod[] = ["QR_SCAN", "MANUAL"];

interface CheckinBody {
  classSessionId?: string;
  classScheduleId?: string;
  studentId?: string;
  method?: string;
  notes?: string | null;
}

/**
 * POST /api/checkin — record a student's attendance at a class session. Used by
 * both the instructor's manual check-in and the QR self-check-in page.
 * Idempotent: checking in twice keeps the original record.
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
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  let body: CheckinBody;
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
      { error: "A student is required to check in." },
      { status: 400 },
    );
  }
  const method: CheckinMethod = METHODS.includes(body.method as CheckinMethod)
    ? (body.method as CheckinMethod)
    : "MANUAL";

  // Resolve the session.
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
      include: { classSchedule: { select: { clubId: true } } },
    });
    if (!session || session.classSchedule.clubId !== club.id) {
      return NextResponse.json(
        { error: "Class session not found." },
        { status: 404 },
      );
    }
    if (session.cancelled) {
      return NextResponse.json(
        { error: "This class session was cancelled." },
        { status: 409 },
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

    const attendance = await prisma.attendance.upsert({
      where: {
        classSessionId_studentId: {
          classSessionId: sessionId,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        classSessionId: sessionId,
        studentId: student.id,
        method,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (err) {
    console.error("POST /api/checkin failed", err);
    return NextResponse.json(
      { error: "Could not record the check-in." },
      { status: 500 },
    );
  }
}
