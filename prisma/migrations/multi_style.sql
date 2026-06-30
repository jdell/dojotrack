-- Feature 3: Multiple styles per club
-- Creates the Style and StudentStyle tables, adds style_id FKs to belt_ranks
-- and class_schedules.

-- 1. Create styles table (TEXT ids to match existing schema convention)
CREATE TABLE "styles" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "club_id" TEXT NOT NULL,
  "discipline" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "styles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "styles_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT
);
CREATE INDEX "styles_club_id_idx" ON "styles"("club_id");

-- 2. Create student_styles join table
CREATE TABLE "student_styles" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "student_id" TEXT NOT NULL,
  "style_id" TEXT NOT NULL,
  "belt_rank_id" TEXT,
  "join_date" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_styles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_styles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT,
  CONSTRAINT "student_styles_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE RESTRICT,
  CONSTRAINT "student_styles_belt_rank_id_fkey" FOREIGN KEY ("belt_rank_id") REFERENCES "belt_ranks"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "student_styles_student_id_style_id_key" ON "student_styles"("student_id", "style_id");

-- 3. Add style_id to belt_ranks (nullable for migration)
ALTER TABLE "belt_ranks" ADD COLUMN "style_id" TEXT;
ALTER TABLE "belt_ranks" ADD CONSTRAINT "belt_ranks_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL;

-- 4. Add style_id to class_schedules (nullable for migration)
ALTER TABLE "class_schedules" ADD COLUMN "style_id" TEXT;
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL;

-- 5. Data migration: create a Style for each club's discipline
-- This is meant to be run once. For each club, for each discipline in
-- its disciplines array, create a Style row.
INSERT INTO "styles" ("club_id", "discipline", "name", "order")
SELECT
  c."id" AS "club_id",
  d.value AS "discipline",
  CASE d.value
    WHEN 'bjj' THEN 'Brazilian Jiu-Jitsu'
    WHEN 'karate' THEN 'Karate'
    WHEN 'judo' THEN 'Judo'
    WHEN 'taekwondo' THEN 'Taekwondo'
    WHEN 'aikido' THEN 'Aikido'
    WHEN 'kung_fu' THEN 'Kung Fu'
    WHEN 'krav_maga' THEN 'Krav Maga'
    WHEN 'hapkido' THEN 'Hapkido'
    WHEN 'capoeira' THEN 'Capoeira'
    WHEN 'kenpo' THEN 'Kempo / Kenpo'
    WHEN 'tang_soo_do' THEN 'Tang Soo Do'
    ELSE d.value
  END AS "name",
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
