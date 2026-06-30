import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth, isClubAdmin } from "@/lib/auth-context";
import { DISCIPLINES } from "@/lib/constants";

/** GET /api/styles — list the current club's styles. */
export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ styles: [] });
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) return NextResponse.json({ styles: [] });
  try {
    const styles = await prisma.style.findMany({
      where: { clubId: club.id },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { beltRanks: true, classSchedules: true, studentStyles: true },
        },
      },
    });
    return NextResponse.json({ styles });
  } catch (err) {
    console.error("GET /api/styles failed", err);
    return NextResponse.json(
      { error: "Could not load styles." },
      { status: 500 },
    );
  }
}

/** POST /api/styles — add a new style to the club. */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DB not configured." }, { status: 503 });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Only OWNER, ADMIN, or impersonating platform admin can manage styles.
  if (!(await isClubAdmin(auth))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const club = await getCurrentClub();
  if (!club)
    return NextResponse.json({ error: "No club found." }, { status: 400 });

  let body: { discipline?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const discipline = body.discipline?.trim();
  if (!discipline) {
    return NextResponse.json(
      { error: "Discipline is required." },
      { status: 400 },
    );
  }

  const discMeta = DISCIPLINES.find((d) => d.value === discipline);
  const name = body.name?.trim() || discMeta?.label || discipline;

  try {
    // Get the next order value.
    const maxOrder = await prisma.style.aggregate({
      where: { clubId: club.id },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    const style = await prisma.style.create({
      data: { clubId: club.id, discipline, name, order },
    });

    // Also add to the club's disciplines array if not already there.
    if (!club.disciplines.includes(discipline)) {
      await prisma.club.update({
        where: { id: club.id },
        data: { disciplines: { push: discipline } },
      });
    }

    return NextResponse.json({ style }, { status: 201 });
  } catch (err) {
    console.error("POST /api/styles failed", err);
    return NextResponse.json(
      { error: "Could not create style." },
      { status: 500 },
    );
  }
}
