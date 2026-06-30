import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth, isClubAdmin } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/styles/[id] — update a style (name, active, order). */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DB not configured." }, { status: 503 });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!(await isClubAdmin(auth))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const club = await getCurrentClub();
  if (!club)
    return NextResponse.json({ error: "No club found." }, { status: 400 });

  const style = await prisma.style.findFirst({
    where: { id, clubId: club.id },
  });
  if (!style)
    return NextResponse.json({ error: "Style not found." }, { status: 404 });

  let body: { name?: string; active?: boolean; order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  try {
    const updated = await prisma.style.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
    });
    return NextResponse.json({ style: updated });
  } catch (err) {
    console.error("PATCH /api/styles/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update style." },
      { status: 500 },
    );
  }
}

/** DELETE /api/styles/[id] — delete a style if it has no linked data. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DB not configured." }, { status: 503 });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (!(await isClubAdmin(auth))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const club = await getCurrentClub();
  if (!club)
    return NextResponse.json({ error: "No club found." }, { status: 400 });

  const style = await prisma.style.findFirst({
    where: { id, clubId: club.id },
    include: {
      _count: {
        select: { beltRanks: true, classSchedules: true, studentStyles: true },
      },
    },
  });
  if (!style)
    return NextResponse.json({ error: "Style not found." }, { status: 404 });

  const total =
    style._count.beltRanks +
    style._count.classSchedules +
    style._count.studentStyles;
  if (total > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a style that has belt ranks, classes, or students linked to it. Deactivate it instead.",
      },
      { status: 409 },
    );
  }

  try {
    await prisma.style.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/styles/[id] failed", err);
    return NextResponse.json(
      { error: "Could not delete style." },
      { status: 500 },
    );
  }
}
