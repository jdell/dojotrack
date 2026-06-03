import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

/** GET /api/families — list the current club's families with member counts. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ families: [] });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ families: [] });
  }
  try {
    const families = await prisma.family.findMany({
      where: { clubId: club.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { students: true } } },
    });
    return NextResponse.json({ families });
  } catch (err) {
    console.error("GET /api/families failed", err);
    return NextResponse.json(
      { error: "Could not load families." },
      { status: 500 },
    );
  }
}

/** POST /api/families — create a family for the current club. */
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

  let name: string | undefined;
  try {
    name = (await request.json())?.name?.trim();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json(
      { error: "A family name is required." },
      { status: 400 },
    );
  }

  try {
    const family = await prisma.family.create({
      data: { name, clubId: club.id },
    });
    return NextResponse.json({ family }, { status: 201 });
  } catch (err) {
    console.error("POST /api/families failed", err);
    return NextResponse.json(
      { error: "Could not create the family." },
      { status: 500 },
    );
  }
}
