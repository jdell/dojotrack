-- Add currency column to clubs table
ALTER TABLE "clubs" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'eur';

-- Add child max age setting (default 15 = under 16 is "children")
ALTER TABLE "clubs" ADD COLUMN "child_max_age" INTEGER NOT NULL DEFAULT 15;
