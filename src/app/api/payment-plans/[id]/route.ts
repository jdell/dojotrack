import { NextResponse } from "next/server";
import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

const INTERVALS: BillingInterval[] = [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "ONE_TIME",
];

/** GET /api/payment-plans/[id] — a single plan, scoped to the current club. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  try {
    const plan = await prisma.paymentPlan.findFirst({
      where: { id, clubId: club.id },
    });
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("GET /api/payment-plans/[id] failed", err);
    return NextResponse.json(
      { error: "Could not load the plan." },
      { status: 500 },
    );
  }
}

interface UpdatePlanBody {
  name?: string;
  description?: string | null;
  amount?: number | string;
  currency?: string;
  interval?: string;
  active?: boolean;
}

/**
 * PATCH /api/payment-plans/[id] — update a payment plan. Only the fields
 * supplied in the body change. If amount, currency, or interval change and
 * the plan has a stripePriceId, it is nulled out so the next checkout creates
 * a fresh Stripe Price (Stripe prices are immutable).
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  const existing = await prisma.paymentPlan.findFirst({
    where: { id, clubId: club.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  let body: UpdatePlanBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  let priceFieldChanged = false;

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "A plan name is required." },
        { status: 400 },
      );
    }
    data.name = name;
  }

  if (body.description !== undefined) {
    data.description = body.description?.trim() || null;
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Enter a price greater than zero." },
        { status: 400 },
      );
    }
    data.amount = amount.toFixed(2);
    if (amount.toFixed(2) !== Number(existing.amount).toFixed(2)) {
      priceFieldChanged = true;
    }
  }

  if (body.currency !== undefined) {
    const currency = (body.currency.trim() || "usd").toLowerCase();
    data.currency = currency;
    if (currency !== existing.currency) {
      priceFieldChanged = true;
    }
  }

  if (body.interval !== undefined) {
    const interval = INTERVALS.includes(body.interval as BillingInterval)
      ? (body.interval as BillingInterval)
      : existing.interval;
    data.interval = interval;
    if (interval !== existing.interval) {
      priceFieldChanged = true;
    }
  }

  if (body.active !== undefined) {
    data.active = Boolean(body.active);
  }

  // Stripe prices are immutable — if amount, currency, or interval changed,
  // null out the cached stripePriceId so the next checkout creates a new one.
  if (priceFieldChanged && existing.stripePriceId) {
    data.stripePriceId = null;
  }

  try {
    const plan = await prisma.paymentPlan.update({ where: { id }, data });
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("PATCH /api/payment-plans/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the plan." },
      { status: 500 },
    );
  }
}
