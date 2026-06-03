import { NextResponse } from "next/server";
import type { Prisma, RequirementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

type RouteContext = { params: Promise<{ id: string }> };

const TYPES: RequirementType[] = [
  "TIME",
  "CLASSES",
  "TECHNIQUE",
  "COMPETITION",
  "CUSTOM",
];

/** Confirm a requirement exists and belongs to the current club's ranks. */
async function ownedRequirement(id: string, clubId: string) {
  return prisma.beltRequirement.findFirst({
    where: { id, beltRank: { clubId } },
    select: { id: true },
  });
}

interface UpdateBody {
  name?: string;
  description?: string | null;
  type?: string;
  targetValue?: number | string | null;
  order?: number | null;
}

/** PUT /api/belt-requirements/[id] — edit a requirement. */
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
  const existing = await ownedRequirement(id, club.id);
  if (!existing) {
    return NextResponse.json(
      { error: "Requirement not found." },
      { status: 404 },
    );
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

  const data: Prisma.BeltRequirementUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "A requirement name is required." },
        { status: 400 },
      );
    }
    data.name = name;
  }
  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }
  if (body.type !== undefined) {
    if (!TYPES.includes(body.type as RequirementType)) {
      return NextResponse.json(
        { error: "Invalid requirement type." },
        { status: 400 },
      );
    }
    data.type = body.type as RequirementType;
  }
  if (body.targetValue !== undefined) {
    if (body.targetValue === null || body.targetValue === "") {
      data.targetValue = null;
    } else {
      const n = Number(body.targetValue);
      if (!Number.isInteger(n) || n < 0) {
        return NextResponse.json(
          { error: "Target value must be a whole number." },
          { status: 400 },
        );
      }
      data.targetValue = n;
    }
  }
  if (body.order !== undefined && Number.isInteger(Number(body.order))) {
    data.order = Number(body.order);
  }

  try {
    const requirement = await prisma.beltRequirement.update({
      where: { id },
      data,
    });
    return NextResponse.json({ requirement });
  } catch (err) {
    console.error("PUT /api/belt-requirements/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the requirement." },
      { status: 500 },
    );
  }
}

/** DELETE /api/belt-requirements/[id] — remove a requirement (and its logs). */
export async function DELETE(_request: Request, { params }: RouteContext) {
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
  const existing = await ownedRequirement(id, club.id);
  if (!existing) {
    return NextResponse.json(
      { error: "Requirement not found." },
      { status: 404 },
    );
  }
  try {
    await prisma.beltRequirement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/belt-requirements/[id] failed", err);
    return NextResponse.json(
      { error: "Could not delete the requirement." },
      { status: 500 },
    );
  }
}
