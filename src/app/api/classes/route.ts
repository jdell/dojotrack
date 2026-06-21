import { NextResponse } from "next/server";
import type { ClassLevel, DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const LEVELS: ClassLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
];
const TIME_RE = /^\d{1,2}:\d{2}$/;

/** GET /api/classes — list the current club's active classes. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ classes: [] });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ classes: [] });
  }
  try {
    const classes = await prisma.classSchedule.findMany({
      where: { clubId: club.id, active: true },
      orderBy: [{ startTime: "asc" }, { name: "asc" }],
      include: { instructor: { select: { id: true, fullName: true } } },
    });
    return NextResponse.json({ classes });
  } catch (err) {
    console.error("GET /api/classes failed", err);
    return NextResponse.json(
      { error: "Could not load classes." },
      { status: 500 },
    );
  }
}

interface CreateClassBody {
  name?: string;
  discipline?: string;
  dayOfWeek?: string;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
  instructorId?: string | null;
  maxStudents?: number | string;
  location?: string | null;
  level?: string;
}

/** POST /api/classes — create a recurring weekly class for the current club. */
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
    return NextResponse.json(
      { error: "No club found. Create a club before adding classes." },
      { status: 400 },
    );
  }

  let body: CreateClassBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "A class name is required." },
      { status: 400 },
    );
  }
  const discipline = body.discipline?.trim();
  if (!discipline) {
    return NextResponse.json(
      { error: "Pick a discipline for the class." },
      { status: 400 },
    );
  }
  // Support both single dayOfWeek and multi-day daysOfWeek
  const daysOfWeek: DayOfWeek[] = [];
  if (Array.isArray(body.daysOfWeek) && body.daysOfWeek.length > 0) {
    for (const d of body.daysOfWeek) {
      if (DAYS.includes(d as DayOfWeek)) {
        daysOfWeek.push(d as DayOfWeek);
      }
    }
  } else if (body.dayOfWeek && DAYS.includes(body.dayOfWeek as DayOfWeek)) {
    daysOfWeek.push(body.dayOfWeek as DayOfWeek);
  }
  if (daysOfWeek.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one day of the week." },
      { status: 400 },
    );
  }
  if (!body.startTime || !TIME_RE.test(body.startTime)) {
    return NextResponse.json(
      { error: "Enter a valid start time." },
      { status: 400 },
    );
  }
  if (!body.endTime || !TIME_RE.test(body.endTime)) {
    return NextResponse.json(
      { error: "Enter a valid end time." },
      { status: 400 },
    );
  }
  const startTime: string = body.startTime;
  const endTime: string = body.endTime;
  const maxStudents = Number(body.maxStudents);
  if (!Number.isInteger(maxStudents) || maxStudents < 1) {
    return NextResponse.json(
      { error: "Max students must be a whole number of 1 or more." },
      { status: 400 },
    );
  }
  const level = LEVELS.includes(body.level as ClassLevel)
    ? (body.level as ClassLevel)
    : "ALL_LEVELS";

  try {
    // Only keep an instructor that belongs to this club's teaching staff.
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

    const created = await prisma.$transaction(
      daysOfWeek.map((day) =>
        prisma.classSchedule.create({
          data: {
            clubId: club.id,
            name,
            discipline,
            dayOfWeek: day,
            startTime,
            endTime,
            instructorId,
            maxStudents,
            location: body.location?.trim() || null,
            level,
          },
        })
      )
    );

    return NextResponse.json(
      { classes: created, count: created.length },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/classes failed", err);
    return NextResponse.json(
      { error: "Could not create the class." },
      { status: 500 },
    );
  }
}
