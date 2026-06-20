import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthUser, isPlatformAdmin } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

/** GET /api/admin/clubs — list all clubs for the platform admin. */
export async function GET(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const user = await getAuthUser();
  if (!user || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const clubs = await prisma.club.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        stripeAccountId: true,
        stripeOnboarded: true,
        platformSubscriptionId: true,
        platformCurrentPeriodEnd: true,
        createdAt: true,
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json(
      clubs.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        tier: c.tier,
        studentCount: c._count.students,
        stripeConnected: Boolean(c.stripeAccountId),
        stripeOnboarded: c.stripeOnboarded,
        hasSubscription: Boolean(c.platformSubscriptionId),
        periodEnd: c.platformCurrentPeriodEnd?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /api/admin/clubs failed", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
