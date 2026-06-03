import { NextResponse } from "next/server";
import type { ClassLevel, DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

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
  if (!DAYS.includes(body.dayOfWeek as DayOfWeek)) {
    return NextResponse.json(
      { error: "Pick a valid day of the week." },
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

    const created = await prisma.classSchedule.create({
      data: {
        clubId: club.id,
        name,
        discipline,
        dayOfWeek: body.dayOfWeek as DayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        instructorId,
        maxStudents,
        location: body.location?.trim() || null,
        level,
      },
    });

    return NextResponse.json({ class: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/classes failed", err);
    return NextResponse.json(
      { error: "Could not create the class." },
      { status: 500 },
    );
  }
}
