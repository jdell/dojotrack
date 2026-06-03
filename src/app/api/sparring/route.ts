import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { regenerateSparringPairs } from "@/lib/sparring-service";

interface CreateBody {
  name?: string | null;
  discipline?: string | null;
  date?: string;
  rounds?: number | string;
  studentIds?: string[];
}

/**
 * POST /api/sparring — create a sparring session and auto-generate its pairs.
 * Pairs students by belt proximity, avoids repeat matchups across rounds, and
 * rotates byes for odd rosters (see `src/lib/sparring.ts`).
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
    return NextResponse.json(
      { error: "No club found. Create a club before running sparring." },
      { status: 400 },
    );
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const date = body.date ? new Date(body.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }
  const studentIds = Array.from(new Set(body.studentIds ?? [])).filter(Boolean);
  if (studentIds.length < 2) {
    return NextResponse.json(
      { error: "Select at least two students to pair." },
      { status: 400 },
    );
  }
  const rounds = Math.min(10, Math.max(1, Math.floor(Number(body.rounds) || 1)));

  try {
    const session = await prisma.sparringSession.create({
      data: {
        clubId: club.id,
        name: body.name?.trim() || null,
        discipline: body.discipline?.trim() || null,
        date,
        rounds,
      },
    });
    const pairCount = await regenerateSparringPairs(
      session.id,
      club.id,
      studentIds,
      rounds,
    );
    return NextResponse.json({ id: session.id, pairs: pairCount }, { status: 201 });
  } catch (err) {
    console.error("POST /api/sparring failed", err);
    return NextResponse.json(
      { error: "Could not create the sparring session." },
      { status: 500 },
    );
  }
}
