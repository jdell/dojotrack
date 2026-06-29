-- Feature 3: Multiple styles per club
-- Creates the Style and StudentStyle tables, adds style_id FKs to belt_ranks
-- and class_schedules.

-- 1. Create styles table
CREATE TABLE "styles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "club_id" UUID NOT NULL,
  "discipline" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "styles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "styles_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT
);
CREATE INDEX "styles_club_id_idx" ON "styles"("club_id");

-- 2. Create student_styles join table
CREATE TABLE "student_styles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "style_id" UUID NOT NULL,
  "belt_rank_id" UUID,
  "join_date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "student_styles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_styles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
  CONSTRAINT "student_styles_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE RESTRICT,
  CONSTRAINT "student_styles_belt_rank_id_fkey" FOREIGN KEY ("belt_rank_id") REFERENCES "belt_ranks"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "student_styles_student_id_style_id_key" ON "student_styles"("student_id", "style_id");

-- 3. Add style_id to belt_ranks (nullable for migration)
ALTER TABLE "belt_ranks" ADD COLUMN "style_id" UUID;
ALTER TABLE "belt_ranks" ADD CONSTRAINT "belt_ranks_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL;

-- 4. Add style_id to class_schedules (nullable for migration)
ALTER TABLE "class_schedules" ADD COLUMN "style_id" UUID;
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL;

-- 5. Data migration: create a Style for each club's discipline
-- This is meant to be run once. For each club, for each discipline in
-- its disciplines array, create a Style row.
INSERT INTO "styles" ("club_id", "discipline", "name", "order")
SELECT
  c."id" AS "club_id",
  d.value AS "discipline",
  d.value AS "name",
  d.ordinality - 1 AS "order"
FROM "clubs" c,
     LATERAL unnest(c."disciplines") WITH ORDINALITY AS d(value, ordinality);

-- 6. Link existing belt_ranks to their club's first style
UPDATE "belt_ranks" br
SET "style_id" = s."id"
FROM "styles" s
WHERE s."club_id" = br."club_id"
  AND s."order" = 0;

-- 7. Link existing class_schedules to matching styles by discipline
UPDATE "class_schedules" cs
SET "style_id" = s."id"
FROM "styles" s
WHERE s."club_id" = cs."club_id"
  AND s."discipline" = cs."discipline";
