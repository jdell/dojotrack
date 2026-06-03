import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { BillingInterval, PaymentPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

/** Stripe recurring config for a plan interval (undefined = one-time charge). */
function recurringFor(
  interval: BillingInterval,
): Stripe.PriceCreateParams.Recurring | undefined {
  switch (interval) {
    case "MONTHLY":
      return { interval: "month" };
    case "QUARTERLY":
      return { interval: "month", interval_count: 3 };
    case "ANNUAL":
      return { interval: "year" };
    case "ONE_TIME":
      return undefined;
  }
}

/**
 * Find-or-create the Stripe Product + Price backing a plan. Prices are created
 * lazily on first checkout and cached back onto the plan row.
 */
async function ensurePlanPrice(
  stripe: Stripe,
  plan: PaymentPlan,
): Promise<string> {
  if (plan.stripePriceId) return plan.stripePriceId;

  const productId =
    plan.stripeProductId ??
    (
      await stripe.products.create({
        name: plan.name,
        description: plan.description ?? undefined,
        metadata: { planId: plan.id, clubId: plan.clubId },
      })
    ).id;

  const recurring = recurringFor(plan.interval);
  const price = await stripe.prices.create({
    product: productId,
    currency: plan.currency,
    unit_amount: Math.round(Number(plan.amount) * 100),
    ...(recurring ? { recurring } : {}),
  });

  await prisma.paymentPlan.update({
    where: { id: plan.id },
    data: { stripeProductId: productId, stripePriceId: price.id },
  });
  return price.id;
}

interface CheckoutBody {
  studentId?: string;
  planId?: string;
}

/**
 * POST /api/checkout — start a Stripe Checkout Session for a student + plan.
 * Recurring plans open a subscription; ONE_TIME plans a single payment. The
 * resulting Payment/Membership rows are finalised by the webhook.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe isn't configured. Add STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 },
    );
  }
  const stripe = getStripe()!;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.studentId || !body.planId) {
    return NextResponse.json(
      { error: "A student and a plan are required." },
      { status: 400 },
    );
  }

  const [student, plan] = await Promise.all([
    prisma.student.findFirst({
      where: { id: body.studentId, clubId: club.id },
      select: { id: true, fullName: true, email: true },
    }),
    prisma.paymentPlan.findFirst({
      where: { id: body.planId, clubId: club.id, active: true },
    }),
  ]);
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  try {
    const priceId = await ensurePlanPrice(stripe, plan);
    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      plan.interval === "ONE_TIME" ? "payment" : "subscription";
    const metadata = {
      clubId: club.id,
      studentId: student.id,
      planId: plan.id,
    };

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: student.id,
      customer_email: student.email ?? undefined,
      success_url: `${appUrl()}/payments?status=success`,
      cancel_url: `${appUrl()}/payments?status=cancelled`,
      metadata,
      ...(mode === "subscription"
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
    });

    // For one-time charges, record a pending payment so the dashboard reflects
    // the attempt before the webhook confirms it (the webhook flips it to PAID).
    // Subscription payments are recorded per-invoice by the webhook instead, so
    // we don't pre-create one here (it would double-count the first invoice).
    if (mode === "payment") {
      await prisma.payment.create({
        data: {
          clubId: club.id,
          studentId: student.id,
          planId: plan.id,
          amount: plan.amount,
          currency: plan.currency,
          status: "PENDING",
          description: `${plan.name} — ${student.fullName}`,
          stripeCheckoutId: session.id,
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/checkout failed", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}
