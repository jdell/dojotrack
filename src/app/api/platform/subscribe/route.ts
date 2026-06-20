import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthContext } from "@/lib/auth-context";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** The platform subscription product name. */
const PRODUCT_NAME = "EntrenaDojo Pro";
const PRICE_AMOUNT = 2900; // $29.00 in cents

/**
 * Find-or-create the platform Pro product and its monthly price in Stripe.
 * Uses metadata to locate existing products, creating lazily on first call.
 */
async function ensurePlatformPrice(stripe: import("stripe").default): Promise<string> {
  // Look for existing product by metadata.
  const products = await stripe.products.search({
    query: 'metadata["platform_product"]:"entrenadojo_pro"',
  });
  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: "Unlimited students, Stripe Connect, competitions, sparring, exams, and email notifications.",
      metadata: { platform_product: "entrenadojo_pro" },
    });
    productId = product.id;
  }

  // Look for an existing $29/mo price on this product.
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: "recurring",
    limit: 10,
  });
  const existing = prices.data.find(
    (p) =>
      p.unit_amount === PRICE_AMOUNT &&
      p.currency === "usd" &&
      p.recurring?.interval === "month" &&
      p.recurring?.interval_count === 1,
  );
  if (existing) return existing.id;

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: PRICE_AMOUNT,
    recurring: { interval: "month" },
  });
  return price.id;
}

/**
 * POST /api/platform/subscribe — start a Stripe Checkout session for the
 * platform Pro subscription. The club owner pays the platform directly.
 */
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe()!;

  try {
    const priceId = await ensurePlatformPrice(stripe);

    // Find or create a Stripe customer for this club.
    let customerId = ctx.club.platformCustomerId;
    if (!customerId) {
      const owner = ctx.user;
      const customer = await stripe.customers.create({
        email: owner.email ?? undefined,
        name: ctx.club.name,
        metadata: { clubId: ctx.club.id, userId: owner.id },
      });
      customerId = customer.id;
      await prisma.club.update({
        where: { id: ctx.club.id },
        data: { platformCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl()}/settings?upgraded=true`,
      cancel_url: `${appUrl()}/settings?upgrade=cancelled`,
      metadata: { clubId: ctx.club.id, type: "platform_subscription" },
      subscription_data: {
        metadata: { clubId: ctx.club.id, type: "platform_subscription" },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/platform/subscribe failed", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}
