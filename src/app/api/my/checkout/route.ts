import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { BillingInterval, PaymentPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
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
 * Find-or-create the Stripe Product + Price for a plan on a connected account.
 * Connected-account prices are always created fresh (each connected account has
 * its own catalogue). Platform prices are cached on the plan row.
 */
async function ensurePlanPrice(
  stripe: Stripe,
  plan: PaymentPlan,
  stripeAccount?: string,
): Promise<string> {
  if (plan.stripePriceId && !stripeAccount) return plan.stripePriceId;

  const opts = stripeAccount ? { stripeAccount } : undefined;

  const productId =
    !stripeAccount && plan.stripeProductId
      ? plan.stripeProductId
      : (
          await stripe.products.create(
            {
              name: plan.name,
              description: plan.description ?? undefined,
              metadata: { planId: plan.id, clubId: plan.clubId },
            },
            opts,
          )
        ).id;

  const recurring = recurringFor(plan.interval);
  const price = await stripe.prices.create(
    {
      product: productId,
      currency: plan.currency,
      unit_amount: Math.round(Number(plan.amount) * 100),
      ...(recurring ? { recurring } : {}),
    },
    opts,
  );

  if (!stripeAccount) {
    await prisma.paymentPlan.update({
      where: { id: plan.id },
      data: { stripeProductId: productId, stripePriceId: price.id },
    });
  }
  return price.id;
}

interface CheckoutBody {
  planId?: string;
}

/**
 * POST /api/my/checkout -- student initiates their own checkout.
 *
 * Finds the Student record linked to the authenticated user and creates a
 * Stripe Checkout Session for the chosen plan. Reuses the same Connect /
 * platform logic as /api/checkout.
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

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.planId) {
    return NextResponse.json(
      { error: "A plan is required." },
      { status: 400 },
    );
  }

  // Find the student linked to this user.
  const student = await prisma.student.findFirst({
    where: { userId: auth.user.id, clubId: auth.club.id, active: true },
    select: { id: true, fullName: true, email: true },
  });
  if (!student) {
    return NextResponse.json(
      { error: "No student profile found for this account." },
      { status: 404 },
    );
  }

  const plan = await prisma.paymentPlan.findFirst({
    where: { id: body.planId, clubId: auth.club.id, active: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  // Load Connect fields.
  const clubRow = await prisma.club.findUnique({
    where: { id: auth.club.id },
    select: {
      stripeAccountId: true,
      stripeOnboarded: true,
      platformFeePercent: true,
    },
  });
  const useConnect = Boolean(
    clubRow?.stripeAccountId && clubRow?.stripeOnboarded,
  );
  const connectedAccountId = useConnect ? clubRow!.stripeAccountId! : undefined;

  try {
    const priceId = await ensurePlanPrice(stripe, plan, connectedAccountId);
    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      plan.interval === "ONE_TIME" ? "payment" : "subscription";
    const metadata = {
      clubId: auth.club.id,
      studentId: student.id,
      planId: plan.id,
    };

    const applicationFeeAmount =
      useConnect && clubRow?.platformFeePercent
        ? Math.round(
            Number(plan.amount) *
              100 *
              (Number(clubRow.platformFeePercent) / 100),
          )
        : undefined;

    const connectOpts = connectedAccountId
      ? { stripeAccount: connectedAccountId }
      : undefined;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: student.id,
      customer_email: student.email ?? undefined,
      success_url: `${appUrl()}/my?status=success`,
      cancel_url: `${appUrl()}/my?status=cancelled`,
      metadata,
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata,
              ...(applicationFeeAmount
                ? { application_fee_percent: Number(clubRow!.platformFeePercent) }
                : {}),
            },
          }
        : {
            payment_intent_data: {
              metadata,
              ...(applicationFeeAmount
                ? { application_fee_amount: applicationFeeAmount }
                : {}),
            },
          }),
    };

    const session = await stripe.checkout.sessions.create(
      sessionParams,
      connectOpts,
    );

    if (mode === "payment") {
      await prisma.payment.create({
        data: {
          clubId: auth.club.id,
          studentId: student.id,
          planId: plan.id,
          amount: plan.amount,
          currency: plan.currency,
          status: "PENDING",
          description: `${plan.name} — ${student.fullName}`,
          stripeCheckoutId: session.id,
          paymentMethod: "stripe",
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/my/checkout failed", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}
