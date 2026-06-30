import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** POST /api/admin/stop-impersonating — clear the impersonation cookie. */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("impersonate_club_id", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
