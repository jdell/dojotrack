-- Add currency column to clubs table
ALTER TABLE "clubs" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'eur';
