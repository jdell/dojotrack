/**
 * Development seed for DojoTrack.
 *
 * Creates one fully-populated club ("Tokyo Dojo") so a freshly pushed database
 * has something to look at: an owner, a handful of students across BJJ / Karate
 * / Judo belts, two weekly classes with a past session and attendance, and a
 * payment plan.
 *
 * Re-runnable: if the club already exists it is torn down (in FK-safe order)
 * and recreated, so `npm run db:seed` always lands you in the same known state.
 *
 * Refuses to run with NODE_ENV=production — this writes demo data and tears
 * down anything sharing the "tokyo-dojo" slug, which must never touch prod.
 *
 * Run with: `npm run db:seed` (needs DATABASE_URL set).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (process.env.NODE_ENV === "production") {
  console.error("✗ Refusing to run the seed with NODE_ENV=production.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) {
  console.error("✗ DATABASE_URL (or DIRECT_URL) must be set to seed.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const CLUB_SLUG = "tokyo-dojo";
const OWNER_AUTH_ID = "seed-tokyo-dojo-owner";

/** Belt ranks to seed, drawn from three systems. `order` keeps each ladder
 *  sortable; the offsets stop the three systems from colliding. */
const BELT_RANKS = [
  // Brazilian Jiu-Jitsu (the club's primary system)
  { key: "bjj-white", name: "White Belt", hex: "#F1F5F9", order: 0 },
  { key: "bjj-blue", name: "Blue Belt", hex: "#2563EB", order: 1 },
  { key: "bjj-purple", name: "Purple Belt", hex: "#7C3AED", order: 2 },
  { key: "bjj-brown", name: "Brown Belt", hex: "#78350F", order: 3 },
  { key: "bjj-black", name: "Black Belt", hex: "#111827", order: 4 },
  // Karate
  { key: "karate-white", name: "Karate White (10th Kyu)", hex: "#F1F5F9", order: 100 },
  { key: "karate-green", name: "Karate Green (7th Kyu)", hex: "#16A34A", order: 103 },
  // Judo
  { key: "judo-yellow", name: "Judo Yellow (5th Kyu)", hex: "#FACC15", order: 200 },
] as const;

type BeltKey = (typeof BELT_RANKS)[number]["key"];

const STUDENTS: {
  fullName: string;
  belt: BeltKey;
  phone: string;
  weight: number;
}[] = [
  { fullName: "Hiroshi Tanaka", belt: "bjj-blue", phone: "+15550100001", weight: 78 },
  { fullName: "Yuki Sato", belt: "bjj-white", phone: "+15550100002", weight: 64 },
  { fullName: "Mei Lin", belt: "karate-green", phone: "+15550100003", weight: 59 },
  { fullName: "Carlos Silva", belt: "judo-yellow", phone: "+15550100004", weight: 85 },
  { fullName: "Aisha Khan", belt: "karate-white", phone: "+15550100005", weight: 70 },
];

/** Delete every row belonging to the club, children before parents. */
async function teardown(clubId: string): Promise<void> {
  await prisma.attendance.deleteMany({
    where: { classSession: { classSchedule: { clubId } } },
  });
  await prisma.booking.deleteMany({
    where: { classSession: { classSchedule: { clubId } } },
  });
  await prisma.classSession.deleteMany({ where: { classSchedule: { clubId } } });
  await prisma.classSchedule.deleteMany({ where: { clubId } });
  await prisma.payment.deleteMany({ where: { clubId } });
  await prisma.membership.deleteMany({ where: { clubId } });
  await prisma.studentTechniqueLog.deleteMany({
    where: { student: { clubId } },
  });
  await prisma.gradingCandidate.deleteMany({ where: { exam: { clubId } } });
  await prisma.gradingExam.deleteMany({ where: { clubId } });
  await prisma.competitionEntry.deleteMany({
    where: { competition: { clubId } },
  });
  await prisma.competition.deleteMany({ where: { clubId } });
  await prisma.sparringPair.deleteMany({ where: { session: { clubId } } });
  await prisma.sparringSession.deleteMany({ where: { clubId } });
  await prisma.paymentPlan.deleteMany({ where: { clubId } });
  await prisma.beltRequirement.deleteMany({
    where: { beltRank: { clubId } },
  });
  await prisma.student.deleteMany({ where: { clubId } });
  await prisma.family.deleteMany({ where: { clubId } });
  await prisma.beltRank.deleteMany({ where: { clubId } });
  await prisma.user.deleteMany({ where: { clubId } });
  await prisma.club.delete({ where: { id: clubId } });
}

async function main(): Promise<void> {
  const existing = await prisma.club.findUnique({
    where: { slug: CLUB_SLUG },
    select: { id: true },
  });
  if (existing) {
    console.log(`• Existing "${CLUB_SLUG}" found — tearing it down first.`);
    await teardown(existing.id);
  }

  const club = await prisma.club.create({
    data: {
      name: "Tokyo Dojo",
      slug: CLUB_SLUG,
      city: "Tokyo",
      country: "Japan",
      phone: "+15550100000",
      email: "info@tokyo-dojo.example",
      description: "A friendly mixed martial arts club in the heart of Tokyo.",
      disciplines: ["bjj", "karate", "judo"],
      beltSystemId: "bjj",
    },
  });
  console.log(`✓ Club: ${club.name} (${club.slug})`);

  const owner = await prisma.user.create({
    data: {
      authId: OWNER_AUTH_ID,
      fullName: "Sensei Kenji Tanaka",
      phone: "+15550100000",
      email: "sensei@tokyo-dojo.example",
      role: "OWNER",
      clubId: club.id,
    },
  });
  console.log(`✓ Owner: ${owner.fullName}`);

  // Belt ranks → keep a key→id map so students can reference them.
  const beltIdByKey = new Map<BeltKey, string>();
  for (const b of BELT_RANKS) {
    const rank = await prisma.beltRank.create({
      data: {
        clubId: club.id,
        name: b.name,
        color: b.hex,
        hexColor: b.hex,
        order: b.order,
      },
    });
    beltIdByKey.set(b.key, rank.id);
  }
  console.log(`✓ Belt ranks: ${BELT_RANKS.length}`);

  // Students.
  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    const student = await prisma.student.create({
      data: {
        clubId: club.id,
        fullName: s.fullName,
        phone: s.phone,
        weight: s.weight,
        beltRankId: beltIdByKey.get(s.belt) ?? null,
      },
    });
    studentIds.push(student.id);
  }
  console.log(`✓ Students: ${STUDENTS.length}`);

  // Two weekly classes, the first taught by the owner.
  const bjjClass = await prisma.classSchedule.create({
    data: {
      clubId: club.id,
      name: "Adults BJJ Fundamentals",
      discipline: "bjj",
      dayOfWeek: "MON",
      startTime: "18:00",
      endTime: "19:30",
      instructorId: owner.id,
      maxStudents: 20,
      location: "Main Mat",
      level: "BEGINNER",
    },
  });
  await prisma.classSchedule.create({
    data: {
      clubId: club.id,
      name: "Kids Karate",
      discipline: "karate",
      dayOfWeek: "WED",
      startTime: "17:00",
      endTime: "18:00",
      instructorId: owner.id,
      maxStudents: 15,
      location: "Studio B",
      level: "ALL_LEVELS",
    },
  });
  console.log("✓ Class schedules: 2");

  // A past session of the BJJ class with a few check-ins, so attendance and the
  // "classes attended" requirement have something to compute from.
  const sessionDate = new Date("2026-05-25T18:00:00.000Z");
  const session = await prisma.classSession.create({
    data: { classScheduleId: bjjClass.id, date: sessionDate },
  });
  for (const studentId of studentIds.slice(0, 3)) {
    await prisma.attendance.create({
      data: {
        classSessionId: session.id,
        studentId,
        method: "MANUAL",
        checkedInAt: sessionDate,
      },
    });
  }
  console.log("✓ Attendance: 3 check-ins on one past session");

  // One payment plan.
  await prisma.paymentPlan.create({
    data: {
      clubId: club.id,
      name: "Adults Unlimited",
      description: "Unlimited classes, billed monthly.",
      amount: "120.00",
      currency: "usd",
      interval: "MONTHLY",
    },
  });
  console.log("✓ Payment plan: Adults Unlimited ($120/mo)");

  console.log("\n✅ Seed complete.");
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
