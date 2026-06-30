import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthUser, isPlatformAdmin } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

/** POST /api/admin/impersonate — start viewing the app as a specific club. */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 },
    );
  }

  const user = await getAuthUser();
  if (!user || !isPlatformAdmin(user.email, user.phone)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { clubId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!body.clubId || typeof body.clubId !== "string") {
    return NextResponse.json(
      { error: "clubId is required." },
      { status: 400 },
    );
  }

  try {
    const club = await prisma.club.findUnique({
      where: { id: body.clubId },
      select: { id: true, name: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found." }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set("impersonate_club_id", club.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return NextResponse.json({ ok: true, clubName: club.name });
  } catch (err) {
    console.error("POST /api/admin/impersonate failed", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
