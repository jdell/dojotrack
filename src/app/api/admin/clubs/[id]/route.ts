import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthUser, isPlatformAdmin } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

/** GET /api/admin/clubs/[id] — single club detail for the platform admin. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const user = await getAuthUser();
  if (!user || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, paymentPlans: true, payments: true } },
        users: {
          where: { role: "OWNER" },
          take: 1,
          select: { fullName: true, email: true },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found." }, { status: 404 });
    }

    const owner = club.users[0] ?? null;

    return NextResponse.json({
      id: club.id,
      name: club.name,
      slug: club.slug,
      tier: club.tier,
      email: club.email,
      phone: club.phone,
      city: club.city,
      country: club.country,
      disciplines: club.disciplines,
      stripeAccountId: club.stripeAccountId,
      stripeOnboarded: club.stripeOnboarded,
      platformCustomerId: club.platformCustomerId,
      platformSubscriptionId: club.platformSubscriptionId,
      platformCurrentPeriodEnd: club.platformCurrentPeriodEnd?.toISOString() ?? null,
      studentCount: club._count.students,
      planCount: club._count.paymentPlans,
      paymentCount: club._count.payments,
      ownerName: owner?.fullName ?? null,
      ownerEmail: owner?.email ?? null,
      createdAt: club.createdAt.toISOString(),
      updatedAt: club.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/admin/clubs/[id] failed", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}

/** PATCH /api/admin/clubs/[id] — update a club's tier (platform admin only). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const user = await getAuthUser();
  if (!user || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (body.tier && !["FREE", "PRO"].includes(body.tier)) {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }

  try {
    const updated = await prisma.club.update({
      where: { id },
      data: {
        ...(body.tier ? { tier: body.tier as "FREE" | "PRO" } : {}),
      },
      select: { id: true, tier: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/admin/clubs/[id] failed", err);
    return NextResponse.json({ error: "Could not update club." }, { status: 500 });
  }
}
