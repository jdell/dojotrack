-- Add onboarding email sequence tracking to clubs
ALTER TABLE "clubs" ADD COLUMN "onboarding_step" INTEGER NOT NULL DEFAULT 0;
