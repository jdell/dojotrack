import { NextResponse } from "next/server";
import type { CompetitionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES: CompetitionStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

interface UpdateBody {
  name?: string;
  discipline?: string | null;
  date?: string;
  location?: string | null;
  description?: string | null;
  status?: string;
}

/** PATCH /api/competitions/[id] — edit competition fields / status. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
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

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Prisma.CompetitionUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "A competition name is required." },
        { status: 400 },
      );
    }
    data.name = name;
  }
  if (body.discipline !== undefined)
    data.discipline = body.discipline?.trim() || null;
  if (body.location !== undefined)
    data.location = body.location?.trim() || null;
  if (body.description !== undefined)
    data.description = body.description?.trim() || null;
  if (body.date !== undefined) {
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
    }
    data.date = date;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as CompetitionStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status as CompetitionStatus;
  }

  try {
    const updated = await prisma.competition.update({ where: { id }, data });
    return NextResponse.json({ competition: updated });
  } catch (err) {
    console.error("PATCH /api/competitions/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the competition." },
      { status: 500 },
    );
  }
}

/** DELETE /api/competitions/[id] — remove a competition (and its entries). */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
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

  try {
    await prisma.competition.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/competitions/[id] failed", err);
    return NextResponse.json(
      { error: "Could not delete the competition." },
      { status: 500 },
    );
  }
}
