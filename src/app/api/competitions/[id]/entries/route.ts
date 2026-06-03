import { NextResponse } from "next/server";
import type { Medal, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

type RouteContext = { params: Promise<{ id: string }> };

const MEDALS: Medal[] = ["NONE", "GOLD", "SILVER", "BRONZE"];

/** Place a competition for the current club, or null if it isn't theirs. */
async function findClubCompetition(id: string): Promise<string | null> {
  const club = await getCurrentClub();
  if (!club) return null;
  const competition = await prisma.competition.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  return competition?.id ?? null;
}

interface AddEntryBody {
  studentId?: string;
  division?: string | null;
  weightClass?: string | null;
}

/** POST /api/competitions/[id]/entries — enter a student into the competition. */
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
  const competition = await prisma.competition.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  if (!competition) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 },
    );
  }

  let body: AddEntryBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.studentId) {
    return NextResponse.json(
      { error: "Pick a student to enter." },
      { status: 400 },
    );
  }
  const student = await prisma.student.findFirst({
    where: { id: body.studentId, clubId: club.id },
    select: { id: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  try {
    const entry = await prisma.competitionEntry.upsert({
      where: {
        competitionId_studentId: {
          competitionId: id,
          studentId: student.id,
        },
      },
      update: {
        division: body.division?.trim() || null,
        weightClass: body.weightClass?.trim() || null,
      },
      create: {
        competitionId: id,
        studentId: student.id,
        division: body.division?.trim() || null,
        weightClass: body.weightClass?.trim() || null,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("POST /api/competitions/[id]/entries failed", err);
    return NextResponse.json(
      { error: "Could not add the entry." },
      { status: 500 },
    );
  }
}

interface ResultEntry {
  id?: string;
  placement?: number | string | null;
  medal?: string;
  wins?: number | string;
  losses?: number | string;
  division?: string | null;
  weightClass?: string | null;
  notes?: string | null;
}

interface ResultsBody {
  entries?: ResultEntry[];
}

/** PATCH /api/competitions/[id]/entries — record results for entries. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const competitionId = await findClubCompetition(id);
  if (!competitionId) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 },
    );
  }

  let body: ResultsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const entries = (body.entries ?? []).filter(
    (e): e is ResultEntry & { id: string } => Boolean(e.id),
  );

  // Validate ownership + enums up front so the write is all-or-nothing.
  const owned = await prisma.competitionEntry.findMany({
    where: { competitionId, id: { in: entries.map((e) => e.id) } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((e) => e.id));
  for (const e of entries) {
    if (!ownedIds.has(e.id)) {
      return NextResponse.json(
        { error: "A result references an unknown entry." },
        { status: 400 },
      );
    }
    if (e.medal !== undefined && !MEDALS.includes(e.medal as Medal)) {
      return NextResponse.json({ error: "Invalid medal." }, { status: 400 });
    }
  }

  try {
    await prisma.$transaction(
      entries.map((e) => {
        const data: Prisma.CompetitionEntryUpdateInput = {};
        if (e.placement !== undefined) {
          data.placement =
            e.placement === null || e.placement === ""
              ? null
              : Number(e.placement);
        }
        if (e.medal !== undefined) data.medal = e.medal as Medal;
        if (e.wins !== undefined) data.wins = Number(e.wins) || 0;
        if (e.losses !== undefined) data.losses = Number(e.losses) || 0;
        if (e.division !== undefined)
          data.division = e.division?.trim() || null;
        if (e.weightClass !== undefined)
          data.weightClass = e.weightClass?.trim() || null;
        if (e.notes !== undefined) data.notes = e.notes?.trim() || null;
        return prisma.competitionEntry.update({ where: { id: e.id }, data });
      }),
    );
    return NextResponse.json({ ok: true, updated: entries.length });
  } catch (err) {
    console.error("PATCH /api/competitions/[id]/entries failed", err);
    return NextResponse.json(
      { error: "Could not save the results." },
      { status: 500 },
    );
  }
}

/** DELETE /api/competitions/[id]/entries?entryId=… — withdraw an entry. */
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const competitionId = await findClubCompetition(id);
  if (!competitionId) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 },
    );
  }

  const entryId = new URL(request.url).searchParams.get("entryId");
  if (!entryId) {
    return NextResponse.json(
      { error: "An entry id is required." },
      { status: 400 },
    );
  }

  try {
    await prisma.competitionEntry.deleteMany({
      where: { id: entryId, competitionId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/competitions/[id]/entries failed", err);
    return NextResponse.json(
      { error: "Could not remove the entry." },
      { status: 500 },
    );
  }
}
