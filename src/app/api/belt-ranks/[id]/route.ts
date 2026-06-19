import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

interface UpdateBody {
  name?: string;
  color?: string;
  hexColor?: string;
  order?: number;
  minMonths?: number | null;
  minClasses?: number | null;
}

/** PATCH /api/belt-ranks/[id] — update a belt rank's fields. */
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

  const rank = await prisma.beltRank.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  if (!rank) {
    return NextResponse.json({ error: "Rank not found." }, { status: 404 });
  }

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: Prisma.BeltRankUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "A rank name is required." },
        { status: 400 },
      );
    }
    data.name = name;
  }
  if (body.color !== undefined) data.color = body.color;
  if (body.hexColor !== undefined) data.hexColor = body.hexColor;
  if (body.order !== undefined) data.order = body.order;
  if (body.minMonths !== undefined) data.minMonths = body.minMonths;
  if (body.minClasses !== undefined) data.minClasses = body.minClasses;

  try {
    const updated = await prisma.beltRank.update({ where: { id }, data });
    return NextResponse.json({ rank: updated });
  } catch (err) {
    console.error("PATCH /api/belt-ranks/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the rank." },
      { status: 500 },
    );
  }
}

/** DELETE /api/belt-ranks/[id] — remove a rank (only if no students assigned). */
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

  const rank = await prisma.beltRank.findFirst({
    where: { id, clubId: club.id },
    include: { _count: { select: { students: true } } },
  });
  if (!rank) {
    return NextResponse.json({ error: "Rank not found." }, { status: 404 });
  }

  if (rank._count.students > 0) {
    return NextResponse.json(
      { error: "Cannot delete a rank that has students assigned to it." },
      { status: 409 },
    );
  }

  try {
    await prisma.beltRank.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/belt-ranks/[id] failed", err);
    return NextResponse.json(
      { error: "Could not delete the rank." },
      { status: 500 },
    );
  }
}
