import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { MembershipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getStripe, isStripeConfigured, stripeWebhookSecret } from "@/lib/stripe";
import { sendPaymentReceiptEmail } from "@/lib/email";

// Stripe needs the raw, unparsed body to verify the signature.
export const dynamic = "force-dynamic";

/** Map a Stripe subscription status onto our MembershipStatus enum. */
function mapSubscriptionStatus(status: string): MembershipStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELLED";
    default:
      return "INCOMPLETE";
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Period end, tolerating the field moving onto subscription items in newer APIs. */
function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const anySub = sub as any;
  const raw =
    anySub.current_period_end ?? anySub.items?.data?.[0]?.current_period_end;
  return typeof raw === "number" ? new Date(raw * 1000) : null;
}

/** Subscription id off an invoice, across API-version field shifts. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const anyInvoice = invoice as any;
  const raw =
    anyInvoice.subscription ??
    anyInvoice.parent?.subscription_details?.subscription;
  if (!raw) return null;
  return typeof raw === "string" ? raw : (raw.id ?? null);
}

/** Payment-intent id off an invoice, tolerant of expansion shape. */
function invoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  const raw = (invoice as any).payment_intent;
  if (!raw) return null;
  return typeof raw === "string" ? raw : (raw.id ?? null);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Upsert a Membership row from a Stripe Subscription's metadata + status. */
async function upsertMembership(sub: Stripe.Subscription): Promise<void> {
  const { clubId, studentId, planId } = sub.metadata ?? {};
  if (!clubId || !studentId || !planId) return;
  const status = mapSubscriptionStatus(sub.status);
  const currentPeriodEnd = subscriptionPeriodEnd(sub);
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? null);

  await prisma.membership.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: {
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      stripeCustomerId,
    },
    create: {
      clubId,
      studentId,
      planId,
      status,
      stripeSubscriptionId: sub.id,
      stripeCustomerId,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

/** Record (idempotently) a paid/failed invoice as a Payment row. */
async function recordInvoice(
  invoice: Stripe.Invoice,
  paid: boolean,
): Promise<void> {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  let membership = await prisma.membership.findUnique({
    where: { stripeSubscriptionId: subId },
  });
  if (!membership) {
    // Invoice arrived before we saw the subscription — backfill from Stripe.
    const stripe = getStripe();
    if (stripe) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertMembership(sub);
        membership = await prisma.membership.findUnique({
          where: { stripeSubscriptionId: subId },
        });
      } catch {
        // Ignore — nothing more we can do without the subscription.
      }
    }
  }
  if (!membership) return;

  const invoiceId = invoice.id;
  if (invoiceId) {
    const existing = await prisma.payment.findFirst({
      where: { stripeInvoiceId: invoiceId },
      select: { id: true },
    });
    if (existing) return; // already recorded
  }

  const amount = (invoice.amount_paid ?? invoice.amount_due ?? 0) / 100;
  await prisma.payment.create({
    data: {
      clubId: membership.clubId,
      studentId: membership.studentId,
      membershipId: membership.id,
      planId: membership.planId,
      amount: amount.toFixed(2),
      currency: invoice.currency ?? "usd",
      status: paid ? "PAID" : "FAILED",
      description: invoice.description ?? "Subscription payment",
      stripeInvoiceId: invoiceId ?? null,
      stripePaymentIntentId: invoicePaymentIntentId(invoice),
      paidAt: paid ? new Date() : null,
    },
  });

  if (paid) {
    await emailReceipt({
      clubId: membership.clubId,
      studentId: membership.studentId,
      amount,
      currency: invoice.currency ?? "usd",
      description: invoice.description ?? "Subscription payment",
    });
  } else {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: "PAST_DUE" },
    });
  }
}

/** Email a paid receipt to the student, when they have an address on file. */
async function emailReceipt(args: {
  clubId: string;
  studentId: string | null;
  amount: number;
  currency: string;
  description: string | null;
}): Promise<void> {
  if (!args.studentId) return;
  const [student, club] = await Promise.all([
    prisma.student.findUnique({
      where: { id: args.studentId },
      select: { fullName: true, email: true },
    }),
    prisma.club.findUnique({
      where: { id: args.clubId },
      select: { name: true, locale: true },
    }),
  ]);
  if (!student?.email || !club) return;
  await sendPaymentReceiptEmail({
    to: student.email,
    clubName: club.name,
    studentName: student.fullName,
    amount: args.amount,
    currency: args.currency,
    description: args.description,
    paidAt: new Date().toISOString(),
    locale: club.locale,
  });
}

/** POST /api/webhooks/stripe — verify and process Stripe events. */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !isDbConfigured()) {
    return NextResponse.json({ received: true });
  }
  const stripe = getStripe()!;
  const secret = stripeWebhookSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "payment") {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null);
          await prisma.payment.updateMany({
            where: { stripeCheckoutId: session.id },
            data: {
              status: "PAID",
              paidAt: new Date(),
              ...(paymentIntentId
                ? { stripePaymentIntentId: paymentIntentId }
                : {}),
            },
          });
          // Email a receipt for the one-time charge we just confirmed.
          const payment = await prisma.payment.findFirst({
            where: { stripeCheckoutId: session.id },
            select: {
              clubId: true,
              studentId: true,
              amount: true,
              currency: true,
              description: true,
            },
          });
          if (payment) {
            await emailReceipt({
              clubId: payment.clubId,
              studentId: payment.studentId,
              amount: Number(payment.amount),
              currency: payment.currency,
              description: payment.description,
            });
          }
        } else if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertMembership(sub);
        }
        break;
      }
      case "invoice.payment_succeeded":
        await recordInvoice(event.data.object as Stripe.Invoice, true);
        break;
      case "invoice.payment_failed":
        await recordInvoice(event.data.object as Stripe.Invoice, false);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertMembership(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}`, err);
    return NextResponse.json(
      { error: "Handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
