import { NextResponse } from "next/server";
import type { CompetitionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

const STATUSES: CompetitionStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

/** GET /api/competitions — list the current club's competitions. */
export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ competitions: [] });
  const club = await getCurrentClub();
  if (!club) return NextResponse.json({ competitions: [] });
  try {
    const competitions = await prisma.competition.findMany({
      where: { clubId: club.id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ competitions });
  } catch (err) {
    console.error("GET /api/competitions failed", err);
    return NextResponse.json(
      { error: "Could not load competitions." },
      { status: 500 },
    );
  }
}

interface CreateBody {
  name?: string;
  discipline?: string | null;
  date?: string;
  location?: string | null;
  description?: string | null;
  status?: string;
}

/** POST /api/competitions — create a competition for the current club. */
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
      { error: "No club found. Create a club before adding competitions." },
      { status: 400 },
    );
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "A competition name is required." },
      { status: 400 },
    );
  }
  const date = body.date ? new Date(body.date) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }
  const status = STATUSES.includes(body.status as CompetitionStatus)
    ? (body.status as CompetitionStatus)
    : "SCHEDULED";

  try {
    const competition = await prisma.competition.create({
      data: {
        clubId: club.id,
        name,
        discipline: body.discipline?.trim() || null,
        date,
        location: body.location?.trim() || null,
        description: body.description?.trim() || null,
        status,
      },
    });
    return NextResponse.json({ competition }, { status: 201 });
  } catch (err) {
    console.error("POST /api/competitions failed", err);
    return NextResponse.json(
      { error: "Could not create the competition." },
      { status: 500 },
    );
  }
}
