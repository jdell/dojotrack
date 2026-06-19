import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { BillingInterval, PaymentPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
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
 * Find-or-create the Stripe Product + Price backing a plan. For connected
 * accounts, products/prices are always created fresh on the connected account.
 * For platform accounts, the existing caching on the plan row applies.
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

interface PublicCheckoutBody {
  clubSlug: string;
  planId: string;
  studentName: string;
  studentEmail?: string;
}

/**
 * POST /api/pay — start a Stripe Checkout Session for a public payment link.
 * No auth required. The student name + email are collected on the form and
 * passed to Stripe as metadata so the webhook can find-or-create the student.
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
      { error: "Stripe isn't configured. Payments are not available." },
      { status: 503 },
    );
  }
  const stripe = getStripe()!;

  let body: PublicCheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.clubSlug || !body.planId || !body.studentName?.trim()) {
    return NextResponse.json(
      { error: "Club slug, plan, and student name are required." },
      { status: 400 },
    );
  }

  // Look up the club and verify Stripe Connect status.
  const club = await prisma.club.findUnique({
    where: { slug: body.clubSlug },
    select: {
      id: true,
      slug: true,
      stripeAccountId: true,
      stripeOnboarded: true,
      platformFeePercent: true,
    },
  });
  if (!club) {
    return NextResponse.json({ error: "Club not found." }, { status: 404 });
  }

  const plan = await prisma.paymentPlan.findFirst({
    where: { id: body.planId, clubId: club.id, active: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const useConnect = Boolean(club.stripeAccountId && club.stripeOnboarded);
  const connectedAccountId = useConnect ? club.stripeAccountId! : undefined;

  try {
    // Find-or-create the student before building the Stripe session so we can
    // include studentId in the metadata (the webhook needs it for memberships).
    let student = await prisma.student.findFirst({
      where: {
        clubId: club.id,
        fullName: body.studentName.trim(),
      },
      select: { id: true },
    });
    if (!student) {
      student = await prisma.student.create({
        data: {
          clubId: club.id,
          fullName: body.studentName.trim(),
          email: body.studentEmail?.trim() || null,
        },
        select: { id: true },
      });
    }

    const priceId = await ensurePlanPrice(stripe, plan, connectedAccountId);
    const mode: Stripe.Checkout.SessionCreateParams.Mode =
      plan.interval === "ONE_TIME" ? "payment" : "subscription";

    const metadata = {
      clubId: club.id,
      studentId: student.id,
      planId: plan.id,
      publicPayment: "true",
      studentName: body.studentName.trim(),
      studentEmail: body.studentEmail?.trim() ?? "",
    };

    const applicationFeeAmount =
      useConnect && club.platformFeePercent
        ? Math.round(
            Number(plan.amount) *
              100 *
              (Number(club.platformFeePercent) / 100),
          )
        : undefined;

    const connectOpts = connectedAccountId
      ? { stripeAccount: connectedAccountId }
      : undefined;

    const successUrl = `${appUrl()}/pay/${club.slug}?status=success`;
    const cancelUrl = `${appUrl()}/pay/${club.slug}?status=cancelled&plan=${plan.id}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: student.id,
      customer_email: body.studentEmail?.trim() || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata,
              ...(applicationFeeAmount
                ? { application_fee_percent: Number(club.platformFeePercent) }
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

    // For one-time charges, record a pending payment so the dashboard reflects
    // the attempt before the webhook confirms it.
    if (mode === "payment") {
      await prisma.payment.create({
        data: {
          clubId: club.id,
          studentId: student.id,
          planId: plan.id,
          amount: plan.amount,
          currency: plan.currency,
          status: "PENDING",
          description: `${plan.name} — ${body.studentName.trim()} (payment link)`,
          stripeCheckoutId: session.id,
          paymentMethod: "stripe",
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/pay failed", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}
