import { NextResponse } from "next/server";
import type { RequirementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

const TYPES: RequirementType[] = [
  "TIME",
  "CLASSES",
  "TECHNIQUE",
  "COMPETITION",
  "CUSTOM",
];

/** GET /api/belt-requirements?rankId= — requirements for a belt rank. */
export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ requirements: [] });
  }
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ requirements: [] });
  }
  const rankId = new URL(request.url).searchParams.get("rankId");
  if (!rankId) {
    return NextResponse.json(
      { error: "A rankId is required." },
      { status: 400 },
    );
  }
  try {
    const rank = await prisma.beltRank.findFirst({
      where: { id: rankId, clubId: club.id },
      select: { id: true },
    });
    if (!rank) {
      return NextResponse.json({ error: "Rank not found." }, { status: 404 });
    }
    const requirements = await prisma.beltRequirement.findMany({
      where: { beltRankId: rankId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ requirements });
  } catch (err) {
    console.error("GET /api/belt-requirements failed", err);
    return NextResponse.json(
      { error: "Could not load requirements." },
      { status: 500 },
    );
  }
}

interface CreateBody {
  beltRankId?: string;
  name?: string;
  description?: string | null;
  type?: string;
  targetValue?: number | string | null;
  order?: number | null;
}

/** POST /api/belt-requirements — add a requirement to one of the club's ranks. */
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

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.beltRankId) {
    return NextResponse.json(
      { error: "A belt rank is required." },
      { status: 400 },
    );
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "A requirement name is required." },
      { status: 400 },
    );
  }
  if (!TYPES.includes(body.type as RequirementType)) {
    return NextResponse.json(
      { error: "Pick a valid requirement type." },
      { status: 400 },
    );
  }
  const type = body.type as RequirementType;
  const targetValue = parseTarget(body.targetValue);
  if ((type === "TIME" || type === "CLASSES") && targetValue === null) {
    return NextResponse.json(
      { error: "This requirement needs a target value." },
      { status: 400 },
    );
  }

  try {
    const rank = await prisma.beltRank.findFirst({
      where: { id: body.beltRankId, clubId: club.id },
      select: { id: true },
    });
    if (!rank) {
      return NextResponse.json({ error: "Rank not found." }, { status: 404 });
    }

    const order =
      body.order != null && Number.isInteger(Number(body.order))
        ? Number(body.order)
        : ((
            await prisma.beltRequirement.aggregate({
              where: { beltRankId: rank.id },
              _max: { order: true },
            })
          )._max.order ?? -1) + 1;

    const requirement = await prisma.beltRequirement.create({
      data: {
        beltRankId: rank.id,
        name,
        description: body.description?.trim() || null,
        type,
        targetValue,
        order,
      },
    });
    return NextResponse.json({ requirement }, { status: 201 });
  } catch (err) {
    console.error("POST /api/belt-requirements failed", err);
    return NextResponse.json(
      { error: "Could not add the requirement." },
      { status: 500 },
    );
  }
}

/** Coerce a target value to a non-negative integer, or null. */
function parseTarget(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
