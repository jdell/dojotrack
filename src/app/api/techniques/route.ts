import { NextResponse } from "next/server";
import type { TechniqueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub, getCurrentInstructor } from "@/lib/queries";

const STATUSES: TechniqueStatus[] = ["NOT_ASSESSED", "IN_PROGRESS", "PASSED"];

/** GET /api/techniques?studentId= — a student's manual assessment log. */
export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ logs: [] });
  }
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ logs: [] });
  }
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json(
      { error: "A studentId is required." },
      { status: 400 },
    );
  }
  try {
    const student = await prisma.student.findFirst({
      where: { id: studentId, clubId: club.id },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Unknown student." }, { status: 404 });
    }
    const logs = await prisma.studentTechniqueLog.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ logs });
  } catch (err) {
    console.error("GET /api/techniques failed", err);
    return NextResponse.json(
      { error: "Could not load the assessment log." },
      { status: 500 },
    );
  }
}

interface AssessBody {
  studentId?: string;
  requirementId?: string;
  status?: string;
  notes?: string | null;
}

/**
 * POST /api/techniques — record an instructor's assessment of a student against
 * a manual requirement. Upserts the (student, requirement) log so repeated taps
 * just update the status. Stamps the acting instructor + time.
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

  let body: AssessBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.studentId || !body.requirementId) {
    return NextResponse.json(
      { error: "A student and requirement are required." },
      { status: 400 },
    );
  }
  if (!STATUSES.includes(body.status as TechniqueStatus)) {
    return NextResponse.json(
      { error: "Pick a valid status." },
      { status: 400 },
    );
  }
  const status = body.status as TechniqueStatus;

  try {
    const [student, requirement] = await Promise.all([
      prisma.student.findFirst({
        where: { id: body.studentId, clubId: club.id },
        select: { id: true },
      }),
      prisma.beltRequirement.findFirst({
        where: { id: body.requirementId, beltRank: { clubId: club.id } },
        select: { id: true },
      }),
    ]);
    if (!student) {
      return NextResponse.json({ error: "Unknown student." }, { status: 400 });
    }
    if (!requirement) {
      return NextResponse.json(
        { error: "Unknown requirement." },
        { status: 400 },
      );
    }

    const instructor = await getCurrentInstructor(club.id);
    const assessedAt = status === "NOT_ASSESSED" ? null : new Date();
    const notes = body.notes?.trim() || null;

    const log = await prisma.studentTechniqueLog.upsert({
      where: {
        studentId_beltRequirementId: {
          studentId: student.id,
          beltRequirementId: requirement.id,
        },
      },
      update: {
        status,
        assessedById: instructor?.id ?? null,
        assessedAt,
        notes,
      },
      create: {
        studentId: student.id,
        beltRequirementId: requirement.id,
        status,
        assessedById: instructor?.id ?? null,
        assessedAt,
        notes,
      },
    });
    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    console.error("POST /api/techniques failed", err);
    return NextResponse.json(
      { error: "Could not save the assessment." },
      { status: 500 },
    );
  }
}
