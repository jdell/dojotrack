/**
 * Stripe client singleton + availability gate.
 *
 * Mirrors the Prisma/Supabase no-op convention (see `src/lib/db.ts`): payments
 * are only wired up when `STRIPE_SECRET_KEY` is set, so the app stays buildable
 * and browsable without Stripe configured — the payment dashboard renders an
 * empty state and the checkout/webhook routes return a friendly 503.
 *
 * NOTE: import this only from server code (route handlers / server actions).
 */
import Stripe from "stripe";

/** True when a Stripe secret key is present in the environment. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** The signing secret used to verify incoming webhook events. */
export function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

/** App base URL for checkout success/cancel redirects. */
export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

/**
 * The Stripe client, created lazily and reused across hot-reloads. Returns null
 * when Stripe isn't configured so callers can gate cleanly.
 */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
      appInfo: { name: "EntrenaDojo", url: "https://entrenadojo.app" },
    });
  }
  return globalForStripe.stripe;
}
