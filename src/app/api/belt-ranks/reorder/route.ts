import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

interface ReorderBody {
  rankId: string;
  direction: "up" | "down";
}

/** POST /api/belt-ranks/reorder — swap a rank with its adjacent neighbour. */
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

  let body: ReorderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.rankId || !["up", "down"].includes(body.direction)) {
    return NextResponse.json(
      { error: "rankId and direction (up|down) are required." },
      { status: 400 },
    );
  }

  const rank = await prisma.beltRank.findFirst({
    where: { id: body.rankId, clubId: club.id },
  });
  if (!rank) {
    return NextResponse.json({ error: "Rank not found." }, { status: 404 });
  }

  const targetOrder = body.direction === "up" ? rank.order - 1 : rank.order + 1;
  const neighbour = await prisma.beltRank.findFirst({
    where: { clubId: club.id, order: targetOrder },
  });
  if (!neighbour) {
    return NextResponse.json(
      { error: "Cannot move further in that direction." },
      { status: 400 },
    );
  }

  try {
    // Swap the order values of the two ranks in a transaction.
    await prisma.$transaction([
      prisma.beltRank.update({
        where: { id: rank.id },
        data: { order: neighbour.order },
      }),
      prisma.beltRank.update({
        where: { id: neighbour.id },
        data: { order: rank.order },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/belt-ranks/reorder failed", err);
    return NextResponse.json(
      { error: "Could not reorder the ranks." },
      { status: 500 },
    );
  }
}
