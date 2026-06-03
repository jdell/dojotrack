/**
 * Server-side persistence for sparring pairings. Bridges the pure pairing
 * algorithm (`src/lib/sparring.ts`) and the database: load the chosen students,
 * generate a plan, and write the pairs (replacing any existing ones).
 *
 * NOTE: server-only — imports Prisma. Don't import from client modules.
 */
import { prisma } from "./prisma";
import { generateSparringPlan, type SparringParticipant } from "./sparring";

/**
 * Generate and persist sparring pairs for a session, replacing existing pairs
 * and syncing the session's round count. Returns the number of pairs written.
 */
export async function regenerateSparringPairs(
  sessionId: string,
  clubId: string,
  studentIds: string[],
  rounds: number,
): Promise<number> {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, clubId, active: true },
    include: { beltRank: { select: { order: true } } },
  });
  const participants: SparringParticipant[] = students.map((s) => ({
    id: s.id,
    name: s.fullName,
    beltOrder: s.beltRank?.order ?? null,
    weight: null,
  }));

  const plan = generateSparringPlan(participants, rounds);

  await prisma.$transaction([
    prisma.sparringPair.deleteMany({ where: { sessionId } }),
    prisma.sparringPair.createMany({
      data: plan.pairings.map((p) => ({
        sessionId,
        round: p.round,
        mat: p.mat,
        studentAId: p.a.id,
        studentBId: p.b?.id ?? null,
      })),
    }),
    prisma.sparringSession.update({
      where: { id: sessionId },
      data: { rounds: plan.rounds },
    }),
  ]);

  return plan.pairings.length;
}
