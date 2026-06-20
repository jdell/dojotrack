import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthUser, isPlatformAdmin } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — platform-wide statistics for the admin dashboard. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const user = await getAuthUser();
  if (!user || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalClubs,
      totalStudents,
      proClubs,
      recentClubs,
      pastDueClubs,
    ] = await Promise.all([
      prisma.club.count(),
      prisma.student.count({ where: { active: true } }),
      prisma.club.count({ where: { tier: "PRO" } }),
      prisma.club.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          createdAt: true,
          _count: { select: { students: true } },
        },
      }),
      prisma.club.findMany({
        where: {
          tier: "PRO",
          platformCurrentPeriodEnd: { lt: now },
          platformSubscriptionId: { not: null },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          platformCurrentPeriodEnd: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalClubs,
      totalStudents,
      proClubs,
      platformRevenue: proClubs * 29, // $29/mo per PRO club
      recentClubs: recentClubs.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        tier: c.tier,
        studentCount: c._count.students,
        createdAt: c.createdAt.toISOString(),
      })),
      pastDueClubs: pastDueClubs.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        platformCurrentPeriodEnd: c.platformCurrentPeriodEnd?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/stats failed", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
