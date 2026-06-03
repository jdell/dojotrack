import { NextResponse } from "next/server";
import type { CandidateResult, ExamStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { notifyStudents } from "@/lib/notify";

type RouteContext = { params: Promise<{ id: string }> };

const RESULTS: CandidateResult[] = ["PENDING", "PASS", "FAIL"];
const STATUSES: ExamStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

interface ResultEntry {
  candidateId?: string;
  result?: string;
  techniquesScore?: number | string | null;
  sparringPassed?: boolean | null;
  notes?: string | null;
}

interface ResultsBody {
  results?: ResultEntry[];
  status?: string;
}

/**
 * POST /api/exams/[id]/results — record candidate outcomes. A PASS promotes the
 * student to the exam's target belt and stamps the awarded rank on the
 * candidate (which doubles as belt history); passed students are then notified.
 */
export async function POST(request: Request, { params }: RouteContext) {
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

  let body: ResultsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const exam = await prisma.gradingExam.findFirst({
    where: { id, clubId: club.id },
    include: {
      targetBeltRank: { select: { id: true, name: true } },
      candidates: {
        include: { student: { select: { id: true, fullName: true, phone: true } } },
      },
    },
  });
  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const byId = new Map(exam.candidates.map((c) => [c.id, c] as const));
  const entries = (body.results ?? []).filter(
    (r): r is ResultEntry & { candidateId: string } => Boolean(r.candidateId),
  );

  // Validate every entry up front so the write is all-or-nothing.
  for (const entry of entries) {
    if (!byId.has(entry.candidateId)) {
      return NextResponse.json(
        { error: "A result references an unknown candidate." },
        { status: 400 },
      );
    }
    if (entry.result !== undefined && !RESULTS.includes(entry.result as CandidateResult)) {
      return NextResponse.json(
        { error: "Invalid candidate result." },
        { status: 400 },
      );
    }
  }
  if (body.status !== undefined && !STATUSES.includes(body.status as ExamStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const promoted: { id: string; fullName: string; phone: string | null }[] =
      [];

    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        const candidate = byId.get(entry.candidateId)!;
        const result = (entry.result as CandidateResult) ?? candidate.result;

        const data: Prisma.GradingCandidateUpdateInput = { result };
        if (entry.techniquesScore !== undefined) {
          data.techniquesScore =
            entry.techniquesScore === null || entry.techniquesScore === ""
              ? null
              : Number(entry.techniquesScore);
        }
        if (entry.sparringPassed !== undefined) {
          data.sparringPassed =
            entry.sparringPassed === null
              ? null
              : Boolean(entry.sparringPassed);
        }
        if (entry.notes !== undefined) {
          data.notes = entry.notes?.trim() || null;
        }

        if (result === "PASS") {
          data.newBeltRank = { connect: { id: exam.targetBeltRank.id } };
          await tx.student.update({
            where: { id: candidate.studentId },
            data: { beltRankId: exam.targetBeltRank.id },
          });
          promoted.push(candidate.student);
        } else {
          // No longer a pass — clear any awarded belt (we don't auto-demote).
          data.newBeltRank = { disconnect: true };
        }

        await tx.gradingCandidate.update({
          where: { id: candidate.id },
          data,
        });
      }

      if (body.status !== undefined) {
        await tx.gradingExam.update({
          where: { id },
          data: { status: body.status as ExamStatus },
        });
      }
    });

    if (promoted.length > 0) {
      const message = `Congratulations! You passed your grading and have been promoted to ${exam.targetBeltRank.name} at ${club.name}.`;
      notifyStudents(
        promoted.map((s) => ({ name: s.fullName, phone: s.phone })),
        message,
      );
    }

    return NextResponse.json({ ok: true, promoted: promoted.length });
  } catch (err) {
    console.error("POST /api/exams/[id]/results failed", err);
    return NextResponse.json(
      { error: "Could not save the results." },
      { status: 500 },
    );
  }
}
