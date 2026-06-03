import { NextResponse } from "next/server";
import type { ClassLevel, DayOfWeek, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getClassDetail, getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const LEVELS: ClassLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
];
const TIME_RE = /^\d{1,2}:\d{2}$/;

/** GET /api/classes/[id] — class detail with upcoming sessions and stats. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const detail = await getClassDetail(id, auth.club.id);
  if (!detail) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }
  return NextResponse.json({ class: detail });
}

interface UpdateClassBody {
  name?: string;
  discipline?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  instructorId?: string | null;
  maxStudents?: number | string;
  location?: string | null;
  level?: string;
  active?: boolean;
}

/** PUT /api/classes/[id] — update a class. Only supplied fields change. */
export async function PUT(request: Request, { params }: RouteContext) {
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

  const existing = await prisma.classSchedule.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  let body: UpdateClassBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const data: Prisma.ClassScheduleUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "A class name is required." },
        { status: 400 },
      );
    }
    data.name = name;
  }
  if (body.discipline !== undefined) data.discipline = body.discipline.trim();
  if (body.dayOfWeek !== undefined) {
    if (!DAYS.includes(body.dayOfWeek as DayOfWeek)) {
      return NextResponse.json({ error: "Invalid day." }, { status: 400 });
    }
    data.dayOfWeek = body.dayOfWeek as DayOfWeek;
  }
  if (body.startTime !== undefined) {
    if (!TIME_RE.test(body.startTime)) {
      return NextResponse.json(
        { error: "Invalid start time." },
        { status: 400 },
      );
    }
    data.startTime = body.startTime;
  }
  if (body.endTime !== undefined) {
    if (!TIME_RE.test(body.endTime)) {
      return NextResponse.json({ error: "Invalid end time." }, { status: 400 });
    }
    data.endTime = body.endTime;
  }
  if (body.maxStudents !== undefined) {
    const maxStudents = Number(body.maxStudents);
    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      return NextResponse.json(
        { error: "Max students must be 1 or more." },
        { status: 400 },
      );
    }
    data.maxStudents = maxStudents;
  }
  if (body.location !== undefined) data.location = body.location?.trim() || null;
  if (body.level !== undefined && LEVELS.includes(body.level as ClassLevel)) {
    data.level = body.level as ClassLevel;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.instructorId !== undefined) {
    let instructorId: string | null = null;
    if (body.instructorId) {
      const instructor = await prisma.user.findFirst({
        where: {
          id: body.instructorId,
          clubId: club.id,
          role: { in: ["OWNER", "INSTRUCTOR"] },
        },
        select: { id: true },
      });
      instructorId = instructor?.id ?? null;
    }
    data.instructor = instructorId
      ? { connect: { id: instructorId } }
      : { disconnect: true };
  }

  try {
    const updated = await prisma.classSchedule.update({ where: { id }, data });
    return NextResponse.json({ class: updated });
  } catch (err) {
    console.error("PUT /api/classes/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the class." },
      { status: 500 },
    );
  }
}

/** DELETE /api/classes/[id] — remove a class and its sessions (cascade). */
export async function DELETE(_request: Request, { params }: RouteContext) {
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

  const existing = await prisma.classSchedule.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  try {
    await prisma.classSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/classes/[id] failed", err);
    return NextResponse.json(
      { error: "Could not delete the class." },
      { status: 500 },
    );
  }
}
