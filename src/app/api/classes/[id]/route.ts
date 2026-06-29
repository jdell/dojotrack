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
  styleId?: string | null;
  dayOfWeek?: string;
  daysOfWeek?: string[];
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
  if (body.styleId !== undefined) {
    if (body.styleId) {
      const style = await prisma.style.findFirst({
        where: { id: body.styleId, clubId: club.id },
        select: { id: true },
      });
      data.style = style ? { connect: { id: style.id } } : { disconnect: true };
    } else {
      data.style = { disconnect: true };
    }
  }
  // Support both single dayOfWeek and multi-day daysOfWeek
  const extraDays: DayOfWeek[] = [];
  if (body.daysOfWeek && Array.isArray(body.daysOfWeek) && body.daysOfWeek.length > 0) {
    const validDays = body.daysOfWeek.filter((d) => DAYS.includes(d as DayOfWeek)) as DayOfWeek[];
    if (validDays.length === 0) {
      return NextResponse.json({ error: "Pick at least one day." }, { status: 400 });
    }
    // First day updates this schedule; additional days create new schedules
    data.dayOfWeek = validDays[0];
    extraDays.push(...validDays.slice(1));
  } else if (body.dayOfWeek !== undefined) {
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
          role: { in: ["OWNER", "ADMIN", "INSTRUCTOR"] },
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

    // Create new schedules for additional days (same name/time/instructor/etc.)
    let created: typeof updated[] = [];
    if (extraDays.length > 0) {
      const base = await prisma.classSchedule.findUnique({ where: { id } });
      if (base) {
        created = await prisma.$transaction(
          extraDays.map((day) =>
            prisma.classSchedule.create({
              data: {
                clubId: base.clubId,
                name: base.name,
                discipline: base.discipline,
                styleId: base.styleId,
                dayOfWeek: day,
                startTime: base.startTime,
                endTime: base.endTime,
                instructorId: base.instructorId,
                maxStudents: base.maxStudents,
                location: base.location,
                level: base.level,
              },
            })
          )
        );
      }
    }

    return NextResponse.json({
      class: updated,
      created: created.length,
    });
  } catch (err) {
    console.error("PUT /api/classes/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the class." },
      { status: 500 },
    );
  }
}

/** PATCH /api/classes/[id] — alias for PUT (partial update). */
export { PUT as PATCH };

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
