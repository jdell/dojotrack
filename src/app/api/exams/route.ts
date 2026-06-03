import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub, getExams } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

/** GET /api/exams — the current club's grading exams (upcoming + past). */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ upcoming: [], past: [] });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ upcoming: [], past: [] });
  }
  const exams = await getExams(club.id);
  return NextResponse.json(exams);
}

interface CreateBody {
  targetBeltRankId?: string;
  date?: string;
  location?: string | null;
  fee?: number | string | null;
  notes?: string | null;
  candidateIds?: string[];
}

/**
 * POST /api/exams — schedule a grading. Validates the target rank and any
 * candidates belong to the club, then creates the exam and entries together.
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

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.targetBeltRankId) {
    return NextResponse.json(
      { error: "Pick the belt being tested for." },
      { status: 400 },
    );
  }
  const date = body.date ? new Date(body.date) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "Enter a valid exam date." },
      { status: 400 },
    );
  }
  let fee: number | null = null;
  if (body.fee !== null && body.fee !== undefined && body.fee !== "") {
    const n = Number(body.fee);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { error: "Fee must be a positive amount." },
        { status: 400 },
      );
    }
    fee = n;
  }

  try {
    const target = await prisma.beltRank.findFirst({
      where: { id: body.targetBeltRankId, clubId: club.id },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Target belt not found." },
        { status: 404 },
      );
    }

    // Keep only candidate ids that are real students in this club.
    const requested = Array.from(new Set(body.candidateIds ?? []));
    const validStudents = requested.length
      ? await prisma.student.findMany({
          where: { id: { in: requested }, clubId: club.id },
          select: { id: true },
        })
      : [];

    const exam = await prisma.gradingExam.create({
      data: {
        clubId: club.id,
        targetBeltRankId: target.id,
        date,
        location: body.location?.trim() || null,
        fee,
        notes: body.notes?.trim() || null,
        candidates: {
          create: validStudents.map((s) => ({ studentId: s.id })),
        },
      },
    });
    return NextResponse.json({ exam }, { status: 201 });
  } catch (err) {
    console.error("POST /api/exams failed", err);
    return NextResponse.json(
      { error: "Could not schedule the exam." },
      { status: 500 },
    );
  }
}
