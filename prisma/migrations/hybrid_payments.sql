-- Hybrid Payments: Stripe Connect + manual payment recording
-- Adds connected-account fields to clubs and payment-method tracking to payments.

-- Club: Stripe Connect fields
ALTER TABLE "clubs" ADD COLUMN "stripe_account_id" TEXT;
ALTER TABLE "clubs" ADD COLUMN "stripe_onboarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clubs" ADD COLUMN "platform_fee_percent" DECIMAL(4,2) NOT NULL DEFAULT 3.0;

-- Payment: method + who recorded it
ALTER TABLE "payments" ADD COLUMN "payment_method" TEXT;
ALTER TABLE "payments" ADD COLUMN "recorded_by_id" TEXT;

-- Foreign key: payment.recorded_by_id → users.id
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_recorded_by_id_fkey"
  FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Back-fill existing Stripe payments so the column is queryable from day one.
UPDATE "payments"
  SET "payment_method" = 'stripe'
  WHERE "stripe_checkout_id" IS NOT NULL
     OR "stripe_payment_intent_id" IS NOT NULL
     OR "stripe_invoice_id" IS NOT NULL;
