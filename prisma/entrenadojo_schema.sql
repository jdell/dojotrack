-- =============================================================================
-- EntrenaDojo — Complete PostgreSQL DDL
-- Generated from prisma/schema.prisma
--
-- Target: Supabase (PostgreSQL 15+, gen_random_uuid() available natively)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================

CREATE TYPE "Role" AS ENUM ('OWNER', 'INSTRUCTOR', 'STUDENT', 'PARENT');

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

CREATE TYPE "ClassLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'CANCELLED', 'WAITLISTED');

CREATE TYPE "CheckinMethod" AS ENUM ('QR_SCAN', 'MANUAL');

CREATE TYPE "RequirementType" AS ENUM ('TIME', 'CLASSES', 'TECHNIQUE', 'COMPETITION', 'CUSTOM');

CREATE TYPE "TechniqueStatus" AS ENUM ('NOT_ASSESSED', 'IN_PROGRESS', 'PASSED');

CREATE TYPE "ExamStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE "CandidateResult" AS ENUM ('PENDING', 'PASS', 'FAIL');

CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME');

CREATE TYPE "MembershipStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TYPE "CompetitionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE "Medal" AS ENUM ('NONE', 'GOLD', 'SILVER', 'BRONZE');


-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- clubs (Club)
-- ---------------------------------------------------------------------------
CREATE TABLE clubs (
    id            TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    name          TEXT         NOT NULL,
    slug          TEXT         NOT NULL,
    address       TEXT,
    city          TEXT,
    country       TEXT,
    phone         TEXT,
    email         TEXT,
    description   TEXT,
    logo_url      TEXT,
    website_url   TEXT,
    instagram_url TEXT,
    facebook_url  TEXT,
    youtube_url   TEXT,
    timezone      TEXT,
    locale        TEXT,
    disciplines   TEXT[]       NOT NULL DEFAULT '{}',
    belt_system_id TEXT,
    created_at    TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT clubs_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX clubs_slug_key ON clubs (slug);

-- ---------------------------------------------------------------------------
-- users (User)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id         TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    auth_id    TEXT         NOT NULL,
    full_name  TEXT,
    phone      TEXT,
    email      TEXT,
    role       "Role"       NOT NULL DEFAULT 'STUDENT'::"Role",
    club_id    TEXT,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX users_auth_id_key ON users (auth_id);
CREATE INDEX users_club_id_idx ON users (club_id);

-- ---------------------------------------------------------------------------
-- families (Family)  — must precede students (FK target)
-- ---------------------------------------------------------------------------
CREATE TABLE families (
    id         TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    name       TEXT         NOT NULL,
    club_id    TEXT         NOT NULL,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT families_pkey PRIMARY KEY (id),
    CONSTRAINT families_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX families_club_id_idx ON families (club_id);

-- ---------------------------------------------------------------------------
-- belt_ranks (BeltRank)  — must precede students (FK target)
-- ---------------------------------------------------------------------------
CREATE TABLE belt_ranks (
    id          TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id     TEXT         NOT NULL,
    name        TEXT         NOT NULL,
    color       TEXT         NOT NULL,
    hex_color   TEXT         NOT NULL,
    "order"     INTEGER      NOT NULL,
    min_months  INTEGER,
    min_classes INTEGER,
    created_at  TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT belt_ranks_pkey PRIMARY KEY (id),
    CONSTRAINT belt_ranks_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX belt_ranks_club_id_idx ON belt_ranks (club_id);

-- ---------------------------------------------------------------------------
-- students (Student)
-- ---------------------------------------------------------------------------
CREATE TABLE students (
    id                TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id           TEXT         NOT NULL,
    user_id           TEXT,
    full_name         TEXT         NOT NULL,
    phone             TEXT,
    email             TEXT,
    belt_rank_id      TEXT,
    join_date         TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_of_birth     TIMESTAMP(3) WITHOUT TIME ZONE,
    weight            INTEGER,
    medical_notes     TEXT,
    emergency_contact TEXT,
    emergency_phone   TEXT,
    family_id         TEXT,
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT students_belt_rank_id_fkey FOREIGN KEY (belt_rank_id) REFERENCES belt_ranks (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT students_family_id_fkey FOREIGN KEY (family_id) REFERENCES families (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX students_club_id_idx ON students (club_id);
CREATE INDEX students_family_id_idx ON students (family_id);

-- ---------------------------------------------------------------------------
-- invitations (Invitation)
-- ---------------------------------------------------------------------------
CREATE TABLE invitations (
    id             TEXT               NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id        TEXT               NOT NULL,
    token          TEXT               NOT NULL DEFAULT gen_random_uuid()::TEXT,
    unit_label     TEXT,
    email          TEXT,
    recipient_name TEXT,
    status         "InvitationStatus" NOT NULL DEFAULT 'PENDING'::"InvitationStatus",
    created_at     TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at     TIMESTAMP(3) WITHOUT TIME ZONE,

    CONSTRAINT invitations_pkey PRIMARY KEY (id),
    CONSTRAINT invitations_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX invitations_token_key ON invitations (token);
CREATE INDEX invitations_club_id_idx ON invitations (club_id);

-- ---------------------------------------------------------------------------
-- class_schedules (ClassSchedule)
-- ---------------------------------------------------------------------------
CREATE TABLE class_schedules (
    id            TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id       TEXT         NOT NULL,
    name          TEXT         NOT NULL,
    discipline    TEXT         NOT NULL,
    day_of_week   "DayOfWeek"  NOT NULL,
    start_time    TEXT         NOT NULL,
    end_time      TEXT         NOT NULL,
    instructor_id TEXT,
    max_students  INTEGER      NOT NULL,
    location      TEXT,
    level         "ClassLevel" NOT NULL DEFAULT 'ALL_LEVELS'::"ClassLevel",
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT class_schedules_pkey PRIMARY KEY (id),
    CONSTRAINT class_schedules_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT class_schedules_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX class_schedules_club_id_idx ON class_schedules (club_id);

-- ---------------------------------------------------------------------------
-- class_sessions (ClassSession)
-- ---------------------------------------------------------------------------
CREATE TABLE class_sessions (
    id                       TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    class_schedule_id        TEXT         NOT NULL,
    date                     TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    cancelled                BOOLEAN      NOT NULL DEFAULT FALSE,
    cancel_reason            TEXT,
    substitute_instructor_id TEXT,
    created_at               TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT class_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT class_sessions_class_schedule_id_fkey FOREIGN KEY (class_schedule_id) REFERENCES class_schedules (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT class_sessions_substitute_instructor_id_fkey FOREIGN KEY (substitute_instructor_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX class_sessions_schedule_date_key ON class_sessions (class_schedule_id, date);
CREATE INDEX class_sessions_date_idx ON class_sessions (date);

-- ---------------------------------------------------------------------------
-- bookings (Booking)
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
    id               TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
    class_session_id TEXT            NOT NULL,
    student_id       TEXT            NOT NULL,
    status           "BookingStatus" NOT NULL DEFAULT 'BOOKED'::"BookingStatus",
    booked_at        TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at     TIMESTAMP(3) WITHOUT TIME ZONE,

    CONSTRAINT bookings_pkey PRIMARY KEY (id),
    CONSTRAINT bookings_class_session_id_fkey FOREIGN KEY (class_session_id) REFERENCES class_sessions (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT bookings_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX bookings_session_student_key ON bookings (class_session_id, student_id);
CREATE INDEX bookings_student_id_idx ON bookings (student_id);

-- ---------------------------------------------------------------------------
-- attendances (Attendance)
-- ---------------------------------------------------------------------------
CREATE TABLE attendances (
    id               TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
    class_session_id TEXT            NOT NULL,
    student_id       TEXT            NOT NULL,
    checked_in_at    TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method           "CheckinMethod" NOT NULL DEFAULT 'MANUAL'::"CheckinMethod",
    notes            TEXT,

    CONSTRAINT attendances_pkey PRIMARY KEY (id),
    CONSTRAINT attendances_class_session_id_fkey FOREIGN KEY (class_session_id) REFERENCES class_sessions (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX attendances_session_student_key ON attendances (class_session_id, student_id);
CREATE INDEX attendances_student_id_idx ON attendances (student_id);

-- ---------------------------------------------------------------------------
-- belt_requirements (BeltRequirement)
-- ---------------------------------------------------------------------------
CREATE TABLE belt_requirements (
    id           TEXT              NOT NULL DEFAULT gen_random_uuid()::TEXT,
    belt_rank_id TEXT              NOT NULL,
    name         TEXT              NOT NULL,
    description  TEXT,
    type         "RequirementType" NOT NULL DEFAULT 'TECHNIQUE'::"RequirementType",
    target_value INTEGER,
    "order"      INTEGER           NOT NULL DEFAULT 0,
    created_at   TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT belt_requirements_pkey PRIMARY KEY (id),
    CONSTRAINT belt_requirements_belt_rank_id_fkey FOREIGN KEY (belt_rank_id) REFERENCES belt_ranks (id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX belt_requirements_belt_rank_id_idx ON belt_requirements (belt_rank_id);

-- ---------------------------------------------------------------------------
-- student_technique_logs (StudentTechniqueLog)
-- ---------------------------------------------------------------------------
CREATE TABLE student_technique_logs (
    id                  TEXT              NOT NULL DEFAULT gen_random_uuid()::TEXT,
    student_id          TEXT              NOT NULL,
    belt_requirement_id TEXT              NOT NULL,
    status              "TechniqueStatus" NOT NULL DEFAULT 'NOT_ASSESSED'::"TechniqueStatus",
    assessed_by_id      TEXT,
    assessed_at         TIMESTAMP(3) WITHOUT TIME ZONE,
    notes               TEXT,
    created_at          TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT student_technique_logs_pkey PRIMARY KEY (id),
    CONSTRAINT student_technique_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT student_technique_logs_belt_requirement_id_fkey FOREIGN KEY (belt_requirement_id) REFERENCES belt_requirements (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT student_technique_logs_assessed_by_id_fkey FOREIGN KEY (assessed_by_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX student_technique_logs_student_requirement_key ON student_technique_logs (student_id, belt_requirement_id);
CREATE INDEX student_technique_logs_student_id_idx ON student_technique_logs (student_id);
CREATE INDEX student_technique_logs_belt_requirement_id_idx ON student_technique_logs (belt_requirement_id);

-- ---------------------------------------------------------------------------
-- grading_exams (GradingExam)
-- ---------------------------------------------------------------------------
CREATE TABLE grading_exams (
    id                  TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id             TEXT         NOT NULL,
    target_belt_rank_id TEXT         NOT NULL,
    date                TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    location            TEXT,
    fee                 DECIMAL(10, 2),
    notes               TEXT,
    status              "ExamStatus" NOT NULL DEFAULT 'SCHEDULED'::"ExamStatus",
    created_at          TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT grading_exams_pkey PRIMARY KEY (id),
    CONSTRAINT grading_exams_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT grading_exams_target_belt_rank_id_fkey FOREIGN KEY (target_belt_rank_id) REFERENCES belt_ranks (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX grading_exams_club_id_idx ON grading_exams (club_id);

-- ---------------------------------------------------------------------------
-- grading_candidates (GradingCandidate)
-- ---------------------------------------------------------------------------
CREATE TABLE grading_candidates (
    id               TEXT              NOT NULL DEFAULT gen_random_uuid()::TEXT,
    exam_id          TEXT              NOT NULL,
    student_id       TEXT              NOT NULL,
    result           "CandidateResult" NOT NULL DEFAULT 'PENDING'::"CandidateResult",
    techniques_score INTEGER,
    sparring_passed  BOOLEAN,
    notes            TEXT,
    new_belt_rank_id TEXT,
    created_at       TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT grading_candidates_pkey PRIMARY KEY (id),
    CONSTRAINT grading_candidates_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES grading_exams (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT grading_candidates_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT grading_candidates_new_belt_rank_id_fkey FOREIGN KEY (new_belt_rank_id) REFERENCES belt_ranks (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX grading_candidates_exam_student_key ON grading_candidates (exam_id, student_id);
CREATE INDEX grading_candidates_student_id_idx ON grading_candidates (student_id);

-- ---------------------------------------------------------------------------
-- payment_plans (PaymentPlan)
-- ---------------------------------------------------------------------------
CREATE TABLE payment_plans (
    id                TEXT              NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id           TEXT              NOT NULL,
    name              TEXT              NOT NULL,
    description       TEXT,
    amount            DECIMAL(10, 2)    NOT NULL,
    currency          TEXT              NOT NULL DEFAULT 'usd',
    "interval"        "BillingInterval" NOT NULL DEFAULT 'MONTHLY'::"BillingInterval",
    stripe_product_id TEXT,
    stripe_price_id   TEXT,
    active            BOOLEAN           NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payment_plans_pkey PRIMARY KEY (id),
    CONSTRAINT payment_plans_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX payment_plans_club_id_idx ON payment_plans (club_id);

-- ---------------------------------------------------------------------------
-- memberships (Membership)
-- ---------------------------------------------------------------------------
CREATE TABLE memberships (
    id                      TEXT               NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id                 TEXT               NOT NULL,
    student_id              TEXT               NOT NULL,
    plan_id                 TEXT               NOT NULL,
    status                  "MembershipStatus" NOT NULL DEFAULT 'INCOMPLETE'::"MembershipStatus",
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    current_period_end      TIMESTAMP(3) WITHOUT TIME ZONE,
    cancel_at_period_end    BOOLEAN            NOT NULL DEFAULT FALSE,
    started_at              TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at              TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT memberships_pkey PRIMARY KEY (id),
    CONSTRAINT memberships_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT memberships_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES payment_plans (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX memberships_stripe_subscription_id_key ON memberships (stripe_subscription_id);
CREATE INDEX memberships_club_id_idx ON memberships (club_id);
CREATE INDEX memberships_student_id_idx ON memberships (student_id);

-- ---------------------------------------------------------------------------
-- payments (Payment)
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    id                        TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id                   TEXT            NOT NULL,
    student_id                TEXT,
    membership_id             TEXT,
    plan_id                   TEXT,
    amount                    DECIMAL(10, 2)  NOT NULL,
    currency                  TEXT            NOT NULL DEFAULT 'usd',
    status                    "PaymentStatus" NOT NULL DEFAULT 'PENDING'::"PaymentStatus",
    description               TEXT,
    stripe_checkout_id        TEXT,
    stripe_payment_intent_id  TEXT,
    stripe_invoice_id         TEXT,
    paid_at                   TIMESTAMP(3) WITHOUT TIME ZONE,
    created_at                TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payments_pkey PRIMARY KEY (id),
    CONSTRAINT payments_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT payments_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES memberships (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES payment_plans (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX payments_stripe_payment_intent_id_key ON payments (stripe_payment_intent_id);
CREATE INDEX payments_club_id_idx ON payments (club_id);
CREATE INDEX payments_student_id_idx ON payments (student_id);

-- ---------------------------------------------------------------------------
-- competitions (Competition)
-- ---------------------------------------------------------------------------
CREATE TABLE competitions (
    id          TEXT                NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id     TEXT                NOT NULL,
    name        TEXT                NOT NULL,
    discipline  TEXT,
    date        TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    location    TEXT,
    description TEXT,
    status      "CompetitionStatus" NOT NULL DEFAULT 'SCHEDULED'::"CompetitionStatus",
    created_at  TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT competitions_pkey PRIMARY KEY (id),
    CONSTRAINT competitions_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX competitions_club_id_idx ON competitions (club_id);

-- ---------------------------------------------------------------------------
-- competition_entries (CompetitionEntry)
-- ---------------------------------------------------------------------------
CREATE TABLE competition_entries (
    id             TEXT    NOT NULL DEFAULT gen_random_uuid()::TEXT,
    competition_id TEXT    NOT NULL,
    student_id     TEXT    NOT NULL,
    division       TEXT,
    weight_class   TEXT,
    placement      INTEGER,
    medal          "Medal" NOT NULL DEFAULT 'NONE'::"Medal",
    wins           INTEGER NOT NULL DEFAULT 0,
    losses         INTEGER NOT NULL DEFAULT 0,
    notes          TEXT,
    created_at     TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT competition_entries_pkey PRIMARY KEY (id),
    CONSTRAINT competition_entries_competition_id_fkey FOREIGN KEY (competition_id) REFERENCES competitions (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT competition_entries_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX competition_entries_competition_student_key ON competition_entries (competition_id, student_id);
CREATE INDEX competition_entries_student_id_idx ON competition_entries (student_id);

-- ---------------------------------------------------------------------------
-- sparring_sessions (SparringSession)
-- ---------------------------------------------------------------------------
CREATE TABLE sparring_sessions (
    id         TEXT    NOT NULL DEFAULT gen_random_uuid()::TEXT,
    club_id    TEXT    NOT NULL,
    name       TEXT,
    discipline TEXT,
    date       TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    rounds     INTEGER NOT NULL DEFAULT 1,
    notes      TEXT,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sparring_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sparring_sessions_club_id_fkey FOREIGN KEY (club_id) REFERENCES clubs (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX sparring_sessions_club_id_idx ON sparring_sessions (club_id);

-- ---------------------------------------------------------------------------
-- sparring_pairs (SparringPair)
-- ---------------------------------------------------------------------------
CREATE TABLE sparring_pairs (
    id           TEXT    NOT NULL DEFAULT gen_random_uuid()::TEXT,
    session_id   TEXT    NOT NULL,
    round        INTEGER NOT NULL DEFAULT 1,
    mat          INTEGER,
    student_a_id TEXT    NOT NULL,
    student_b_id TEXT,
    notes        TEXT,
    created_at   TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT sparring_pairs_pkey PRIMARY KEY (id),
    CONSTRAINT sparring_pairs_session_id_fkey FOREIGN KEY (session_id) REFERENCES sparring_sessions (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT sparring_pairs_student_a_id_fkey FOREIGN KEY (student_a_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT sparring_pairs_student_b_id_fkey FOREIGN KEY (student_b_id) REFERENCES students (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX sparring_pairs_session_id_idx ON sparring_pairs (session_id);


-- =============================================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
-- Prisma's @updatedAt is application-level. For defence-in-depth, install a
-- trigger that auto-sets updated_at on UPDATE for tables that carry the column.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on every table.
ALTER TABLE clubs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE students               ENABLE ROW LEVEL SECURITY;
ALTER TABLE families               ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_ranks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances            ENABLE ROW LEVEL SECURITY;
ALTER TABLE belt_requirements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_technique_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_exams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_candidates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_pairs         ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner (Supabase best practice).
ALTER TABLE clubs                  FORCE ROW LEVEL SECURITY;
ALTER TABLE users                  FORCE ROW LEVEL SECURITY;
ALTER TABLE students               FORCE ROW LEVEL SECURITY;
ALTER TABLE families               FORCE ROW LEVEL SECURITY;
ALTER TABLE belt_ranks             FORCE ROW LEVEL SECURITY;
ALTER TABLE invitations            FORCE ROW LEVEL SECURITY;
ALTER TABLE class_schedules        FORCE ROW LEVEL SECURITY;
ALTER TABLE class_sessions         FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings               FORCE ROW LEVEL SECURITY;
ALTER TABLE attendances            FORCE ROW LEVEL SECURITY;
ALTER TABLE belt_requirements      FORCE ROW LEVEL SECURITY;
ALTER TABLE student_technique_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE grading_exams          FORCE ROW LEVEL SECURITY;
ALTER TABLE grading_candidates     FORCE ROW LEVEL SECURITY;
ALTER TABLE payment_plans          FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships            FORCE ROW LEVEL SECURITY;
ALTER TABLE payments               FORCE ROW LEVEL SECURITY;
ALTER TABLE competitions           FORCE ROW LEVEL SECURITY;
ALTER TABLE competition_entries    FORCE ROW LEVEL SECURITY;
ALTER TABLE sparring_sessions      FORCE ROW LEVEL SECURITY;
ALTER TABLE sparring_pairs         FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: resolve the authenticated user's club_id from auth.uid().
-- Used by most policies below to enforce tenant isolation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_club_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT club_id FROM users WHERE auth_id = auth.uid()::TEXT LIMIT 1;
$$;

-- Harden: this SECURITY DEFINER helper is only for use inside the RLS policies
-- below, never via PostgREST /rest/v1/rpc. Revoke EXECUTE from the public API
-- roles. PUBLIC is included because CREATE FUNCTION grants EXECUTE to PUBLIC by
-- default, which would otherwise leave anon/authenticated able to call it.
REVOKE EXECUTE ON FUNCTION public.user_club_id() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- users — the anchor table. auth.uid() must match auth_id.
-- ---------------------------------------------------------------------------
CREATE POLICY users_select ON users
    FOR SELECT TO authenticated
    USING (auth_id = auth.uid()::TEXT);

CREATE POLICY users_insert ON users
    FOR INSERT TO authenticated
    WITH CHECK (auth_id = auth.uid()::TEXT);

CREATE POLICY users_update ON users
    FOR UPDATE TO authenticated
    USING (auth_id = auth.uid()::TEXT)
    WITH CHECK (auth_id = auth.uid()::TEXT);

CREATE POLICY users_delete ON users
    FOR DELETE TO authenticated
    USING (auth_id = auth.uid()::TEXT);

-- ---------------------------------------------------------------------------
-- clubs — accessible to any member of the club.
-- ---------------------------------------------------------------------------
CREATE POLICY clubs_select ON clubs
    FOR SELECT TO authenticated
    USING (id = public.user_club_id());

CREATE POLICY clubs_update ON clubs
    FOR UPDATE TO authenticated
    USING (id = public.user_club_id())
    WITH CHECK (id = public.user_club_id());

-- Insert: anyone authenticated can create a new club (they become OWNER).
CREATE POLICY clubs_insert ON clubs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- ---------------------------------------------------------------------------
-- Tenant-scoped tables: SELECT/INSERT/UPDATE/DELETE where club_id matches.
-- ---------------------------------------------------------------------------

-- students
CREATE POLICY students_select ON students FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY students_insert ON students FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY students_update ON students FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY students_delete ON students FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- families
CREATE POLICY families_select ON families FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY families_insert ON families FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY families_update ON families FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY families_delete ON families FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- belt_ranks
CREATE POLICY belt_ranks_select ON belt_ranks FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY belt_ranks_insert ON belt_ranks FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY belt_ranks_update ON belt_ranks FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY belt_ranks_delete ON belt_ranks FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- invitations
CREATE POLICY invitations_select ON invitations FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY invitations_insert ON invitations FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY invitations_update ON invitations FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY invitations_delete ON invitations FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- class_schedules
CREATE POLICY class_schedules_select ON class_schedules FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY class_schedules_insert ON class_schedules FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY class_schedules_update ON class_schedules FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY class_schedules_delete ON class_schedules FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- grading_exams
CREATE POLICY grading_exams_select ON grading_exams FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY grading_exams_insert ON grading_exams FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY grading_exams_update ON grading_exams FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY grading_exams_delete ON grading_exams FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- payment_plans
CREATE POLICY payment_plans_select ON payment_plans FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY payment_plans_insert ON payment_plans FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY payment_plans_update ON payment_plans FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY payment_plans_delete ON payment_plans FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- memberships
CREATE POLICY memberships_select ON memberships FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY memberships_insert ON memberships FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY memberships_update ON memberships FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY memberships_delete ON memberships FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- payments
CREATE POLICY payments_select ON payments FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY payments_insert ON payments FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY payments_update ON payments FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY payments_delete ON payments FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- competitions
CREATE POLICY competitions_select ON competitions FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY competitions_insert ON competitions FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY competitions_update ON competitions FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY competitions_delete ON competitions FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- sparring_sessions
CREATE POLICY sparring_sessions_select ON sparring_sessions FOR SELECT TO authenticated
    USING (club_id = public.user_club_id());
CREATE POLICY sparring_sessions_insert ON sparring_sessions FOR INSERT TO authenticated
    WITH CHECK (club_id = public.user_club_id());
CREATE POLICY sparring_sessions_update ON sparring_sessions FOR UPDATE TO authenticated
    USING (club_id = public.user_club_id()) WITH CHECK (club_id = public.user_club_id());
CREATE POLICY sparring_sessions_delete ON sparring_sessions FOR DELETE TO authenticated
    USING (club_id = public.user_club_id());

-- ---------------------------------------------------------------------------
-- Join / child tables without their own club_id — access via parent FK chain.
-- ---------------------------------------------------------------------------

-- class_sessions: access via class_schedules.club_id
CREATE POLICY class_sessions_select ON class_sessions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_schedules cs
        WHERE cs.id = class_sessions.class_schedule_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY class_sessions_insert ON class_sessions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM class_schedules cs
        WHERE cs.id = class_schedule_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY class_sessions_update ON class_sessions FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_schedules cs
        WHERE cs.id = class_sessions.class_schedule_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY class_sessions_delete ON class_sessions FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_schedules cs
        WHERE cs.id = class_sessions.class_schedule_id
          AND cs.club_id = public.user_club_id()
    ));

-- bookings: access via class_session → class_schedule.club_id
CREATE POLICY bookings_select ON bookings FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = bookings.class_session_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY bookings_insert ON bookings FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = class_session_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY bookings_update ON bookings FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = bookings.class_session_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY bookings_delete ON bookings FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = bookings.class_session_id
          AND cs.club_id = public.user_club_id()
    ));

-- attendances: same chain as bookings
CREATE POLICY attendances_select ON attendances FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = attendances.class_session_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY attendances_insert ON attendances FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = class_session_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY attendances_update ON attendances FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = attendances.class_session_id
          AND cs.club_id = public.user_club_id()
    ));
CREATE POLICY attendances_delete ON attendances FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM class_sessions csn
        JOIN class_schedules cs ON cs.id = csn.class_schedule_id
        WHERE csn.id = attendances.class_session_id
          AND cs.club_id = public.user_club_id()
    ));

-- belt_requirements: access via belt_ranks.club_id
CREATE POLICY belt_requirements_select ON belt_requirements FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM belt_ranks br
        WHERE br.id = belt_requirements.belt_rank_id
          AND br.club_id = public.user_club_id()
    ));
CREATE POLICY belt_requirements_insert ON belt_requirements FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM belt_ranks br
        WHERE br.id = belt_rank_id
          AND br.club_id = public.user_club_id()
    ));
CREATE POLICY belt_requirements_update ON belt_requirements FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM belt_ranks br
        WHERE br.id = belt_requirements.belt_rank_id
          AND br.club_id = public.user_club_id()
    ));
CREATE POLICY belt_requirements_delete ON belt_requirements FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM belt_ranks br
        WHERE br.id = belt_requirements.belt_rank_id
          AND br.club_id = public.user_club_id()
    ));

-- student_technique_logs: access via students.club_id
CREATE POLICY student_technique_logs_select ON student_technique_logs FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = student_technique_logs.student_id
          AND s.club_id = public.user_club_id()
    ));
CREATE POLICY student_technique_logs_insert ON student_technique_logs FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = student_id
          AND s.club_id = public.user_club_id()
    ));
CREATE POLICY student_technique_logs_update ON student_technique_logs FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = student_technique_logs.student_id
          AND s.club_id = public.user_club_id()
    ));
CREATE POLICY student_technique_logs_delete ON student_technique_logs FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = student_technique_logs.student_id
          AND s.club_id = public.user_club_id()
    ));

-- grading_candidates: access via grading_exams.club_id
CREATE POLICY grading_candidates_select ON grading_candidates FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM grading_exams ge
        WHERE ge.id = grading_candidates.exam_id
          AND ge.club_id = public.user_club_id()
    ));
CREATE POLICY grading_candidates_insert ON grading_candidates FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM grading_exams ge
        WHERE ge.id = exam_id
          AND ge.club_id = public.user_club_id()
    ));
CREATE POLICY grading_candidates_update ON grading_candidates FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM grading_exams ge
        WHERE ge.id = grading_candidates.exam_id
          AND ge.club_id = public.user_club_id()
    ));
CREATE POLICY grading_candidates_delete ON grading_candidates FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM grading_exams ge
        WHERE ge.id = grading_candidates.exam_id
          AND ge.club_id = public.user_club_id()
    ));

-- competition_entries: access via competitions.club_id
CREATE POLICY competition_entries_select ON competition_entries FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM competitions c
        WHERE c.id = competition_entries.competition_id
          AND c.club_id = public.user_club_id()
    ));
CREATE POLICY competition_entries_insert ON competition_entries FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM competitions c
        WHERE c.id = competition_id
          AND c.club_id = public.user_club_id()
    ));
CREATE POLICY competition_entries_update ON competition_entries FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM competitions c
        WHERE c.id = competition_entries.competition_id
          AND c.club_id = public.user_club_id()
    ));
CREATE POLICY competition_entries_delete ON competition_entries FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM competitions c
        WHERE c.id = competition_entries.competition_id
          AND c.club_id = public.user_club_id()
    ));

-- sparring_pairs: access via sparring_sessions.club_id
CREATE POLICY sparring_pairs_select ON sparring_pairs FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sparring_sessions ss
        WHERE ss.id = sparring_pairs.session_id
          AND ss.club_id = public.user_club_id()
    ));
CREATE POLICY sparring_pairs_insert ON sparring_pairs FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM sparring_sessions ss
        WHERE ss.id = session_id
          AND ss.club_id = public.user_club_id()
    ));
CREATE POLICY sparring_pairs_update ON sparring_pairs FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sparring_sessions ss
        WHERE ss.id = sparring_pairs.session_id
          AND ss.club_id = public.user_club_id()
    ));
CREATE POLICY sparring_pairs_delete ON sparring_pairs FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sparring_sessions ss
        WHERE ss.id = sparring_pairs.session_id
          AND ss.club_id = public.user_club_id()
    ));

-- ---------------------------------------------------------------------------
-- Service-role bypass: Supabase's service_role key bypasses RLS by default,
-- so Prisma (server-side with service role) can operate unrestricted.
-- No additional policy is needed for the service role.
-- ---------------------------------------------------------------------------

COMMIT;
