import { NextResponse } from "next/server";
import { getClubBySlug } from "@/lib/queries";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/clubs/[slug] — public club profile by slug. Returns 404 when the
 * club doesn't exist or the database isn't configured.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);
  if (!club) {
    return NextResponse.json({ error: "Club not found." }, { status: 404 });
  }
  return NextResponse.json({ club });
}
