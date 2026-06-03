import { NextResponse } from "next/server";
import { getBeltProgress } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/students/[id]/belt-progress — computed progress toward next belt. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const progress = await getBeltProgress(id, auth.club.id);
  if (!progress) {
    return NextResponse.json(
      { error: "No progress available for this student." },
      { status: 404 },
    );
  }
  return NextResponse.json({ progress });
}
