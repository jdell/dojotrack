import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub, getTeamMembers } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

/** GET /api/team — list the current club's team members. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ members: [] });
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ members: [] });
  }
  try {
    const members = await getTeamMembers(club.id);
    return NextResponse.json({ members });
  } catch (err) {
    console.error("GET /api/team failed", err);
    return NextResponse.json(
      { error: "Could not load team members." },
      { status: 500 },
    );
  }
}
