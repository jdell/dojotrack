import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { requireAuth } from "@/lib/auth-context";
import { appUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { notifySlack } from "@/lib/slack";

/**
 * POST /api/stripe/connect — Create a Stripe Connect Standard account for the
 * club (if one doesn't exist yet) and return an Account Link URL so the club
 * owner can complete onboarding on Stripe's hosted flow.
 */
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe isn't configured. Add STRIPE_SECRET_KEY to enable Connect." },
      { status: 503 },
    );
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripe()!;
  const club = auth.club;

  try {
    let accountId = club.stripeAccountId;

    // Create a Standard connected account if we don't have one yet.
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        metadata: { clubId: club.id },
        ...(club.email ? { email: club.email } : {}),
        business_profile: {
          name: club.name,
          url: club.websiteUrl ?? undefined,
        },
      });
      accountId = account.id;
      await prisma.club.update({
        where: { id: club.id },
        data: { stripeAccountId: accountId },
      });
    }

    // Generate an Account Link for onboarding / re-onboarding.
    const base = appUrl();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/settings?stripe=refresh`,
      return_url: `${base}/settings?stripe=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("POST /api/stripe/connect failed", err);
    return NextResponse.json(
      { error: "Could not start Stripe Connect onboarding." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/stripe/connect — Check if the connected account has completed
 * onboarding and update the club's `stripeOnboarded` flag accordingly.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe isn't configured." },
      { status: 503 },
    );
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const stripe = getStripe()!;
  const club = auth.club;

  if (!club.stripeAccountId) {
    return NextResponse.json({
      connected: false,
      onboarded: false,
      dashboardUrl: null,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(club.stripeAccountId);
    const onboarded = Boolean(
      account.charges_enabled && account.details_submitted,
    );

    // Persist the onboarded state so server components can read it without
    // hitting Stripe on every page load.
    if (onboarded !== club.stripeOnboarded) {
      await prisma.club.update({
        where: { id: club.id },
        data: { stripeOnboarded: onboarded },
      });
      // Fire-and-forget Slack notification when onboarding completes
      if (onboarded) {
        notifySlack(`🔗 Stripe Connect completed: ${club.name}`).catch(() => {});
      }
    }

    // Build a login link so the owner can reach their Stripe Express dashboard.
    let dashboardUrl: string | null = null;
    if (onboarded) {
      try {
        const loginLink = await stripe.accounts.createLoginLink(
          club.stripeAccountId,
        );
        dashboardUrl = loginLink.url;
      } catch {
        // Standard accounts manage their own dashboard at dashboard.stripe.com;
        // createLoginLink only works for Express/Custom. Fall back to null.
        dashboardUrl = "https://dashboard.stripe.com";
      }
    }

    return NextResponse.json({
      connected: true,
      onboarded,
      dashboardUrl,
    });
  } catch (err) {
    console.error("GET /api/stripe/connect failed", err);
    return NextResponse.json(
      { error: "Could not check account status." },
      { status: 500 },
    );
  }
}
