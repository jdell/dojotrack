-- Add instructor profile fields
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "qualifications" TEXT;
ALTER TABLE "users" ADD COLUMN "photo_url" TEXT;
