import { NextResponse } from "next/server";
import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

const INTERVALS: BillingInterval[] = [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "ONE_TIME",
];

/** GET /api/payment-plans — list the current club's plans. */
export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ plans: [] });
  const club = await getCurrentClub();
  if (!club) return NextResponse.json({ plans: [] });
  try {
    const plans = await prisma.paymentPlan.findMany({
      where: { clubId: club.id },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("GET /api/payment-plans failed", err);
    return NextResponse.json(
      { error: "Could not load plans." },
      { status: 500 },
    );
  }
}

interface CreatePlanBody {
  name?: string;
  description?: string | null;
  amount?: number | string;
  currency?: string;
  interval?: string;
}

/** POST /api/payment-plans — create a billable membership plan. */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json(
      { error: "No club found. Create a club before adding plans." },
      { status: 400 },
    );
  }

  let body: CreatePlanBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "A plan name is required." }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Enter a price greater than zero." },
      { status: 400 },
    );
  }
  const interval = INTERVALS.includes(body.interval as BillingInterval)
    ? (body.interval as BillingInterval)
    : "MONTHLY";
  const currency = (body.currency?.trim() || "usd").toLowerCase();

  try {
    const plan = await prisma.paymentPlan.create({
      data: {
        clubId: club.id,
        name,
        description: body.description?.trim() || null,
        amount: amount.toFixed(2),
        currency,
        interval,
      },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    console.error("POST /api/payment-plans failed", err);
    return NextResponse.json(
      { error: "Could not create the plan." },
      { status: 500 },
    );
  }
}
