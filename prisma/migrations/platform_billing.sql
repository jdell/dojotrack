-- Platform billing: club tier + platform subscription tracking
-- Run against the EntrenaDojo database to add platform billing fields.

-- 1. Create the ClubTier enum type.
CREATE TYPE "ClubTier" AS ENUM ('FREE', 'PRO');

-- 2. Add new columns to the clubs table.
ALTER TABLE "clubs" ADD COLUMN "tier" "ClubTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "clubs" ADD COLUMN "platform_customer_id" TEXT;
ALTER TABLE "clubs" ADD COLUMN "platform_subscription_id" TEXT;
ALTER TABLE "clubs" ADD COLUMN "platform_current_period_end" TIMESTAMP(3);

-- 3. Unique constraint on platform_subscription_id.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_platform_subscription_id_key" UNIQUE ("platform_subscription_id");
