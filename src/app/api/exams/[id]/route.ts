import { NextResponse } from "next/server";
import type { ExamStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub, getExamDetail } from "@/lib/queries";

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES: ExamStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

/** GET /api/exams/[id] — full exam detail with candidates. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const detail = await getExamDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }
  return NextResponse.json({ exam: detail });
}

interface UpdateBody {
  date?: string;
  location?: string | null;
  fee?: number | string | null;
  notes?: string | null;
  status?: string;
  candidateIds?: string[];
}

/** PUT /api/exams/[id] — edit exam fields and optionally add candidates. */
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
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

  const existing = await prisma.gradingExam.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const data: Prisma.GradingExamUpdateInput = {};
  if (body.date !== undefined) {
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    data.date = date;
  }
  if (body.location !== undefined) data.location = body.location?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.fee !== undefined) {
    if (body.fee === null || body.fee === "") {
      data.fee = null;
    } else {
      const n = Number(body.fee);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { error: "Fee must be a positive amount." },
          { status: 400 },
        );
      }
      data.fee = n;
    }
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as ExamStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status as ExamStatus;
  }

  try {
    // Add any newly-selected candidates (skip ones already entered).
    const requested = Array.from(new Set(body.candidateIds ?? []));
    if (requested.length > 0) {
      const validStudents = await prisma.student.findMany({
        where: { id: { in: requested }, clubId: club.id },
        select: { id: true },
      });
      if (validStudents.length > 0) {
        await prisma.gradingCandidate.createMany({
          data: validStudents.map((s) => ({ examId: id, studentId: s.id })),
          skipDuplicates: true,
        });
      }
    }

    const exam = await prisma.gradingExam.update({ where: { id }, data });
    return NextResponse.json({ exam });
  } catch (err) {
    console.error("PUT /api/exams/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the exam." },
      { status: 500 },
    );
  }
}
