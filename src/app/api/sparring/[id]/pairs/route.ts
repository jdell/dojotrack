import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { regenerateSparringPairs } from "@/lib/sparring-service";

type RouteContext = { params: Promise<{ id: string }> };

interface RegenerateBody {
  studentIds?: string[];
  rounds?: number | string;
}

/**
 * POST /api/sparring/[id]/pairs — re-pair a session. Re-runs the algorithm over
 * either a supplied roster or the session's current participants, producing a
 * fresh draw (and reaching for new matchups across rounds).
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

  const session = await prisma.sparringSession.findFirst({
    where: { id, clubId: club.id },
    include: { pairs: { select: { studentAId: true, studentBId: true } } },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  let body: RegenerateBody;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Fall back to the session's existing participants when none are supplied.
  let studentIds = Array.from(new Set(body.studentIds ?? [])).filter(Boolean);
  if (studentIds.length === 0) {
    const existing = new Set<string>();
    for (const p of session.pairs) {
      existing.add(p.studentAId);
      if (p.studentBId) existing.add(p.studentBId);
    }
    studentIds = Array.from(existing);
  }
  if (studentIds.length < 2) {
    return NextResponse.json(
      { error: "Select at least two students to pair." },
      { status: 400 },
    );
  }
  const rounds = Math.min(
    10,
    Math.max(1, Math.floor(Number(body.rounds) || session.rounds || 1)),
  );

  try {
    const pairCount = await regenerateSparringPairs(
      session.id,
      club.id,
      studentIds,
      rounds,
    );
    return NextResponse.json({ ok: true, pairs: pairCount });
  } catch (err) {
    console.error("POST /api/sparring/[id]/pairs failed", err);
    return NextResponse.json(
      { error: "Could not regenerate pairs." },
      { status: 500 },
    );
  }
}
