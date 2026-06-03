/**
 * Sparring pairing algorithm (pure, no I/O).
 *
 * Given a roster of participants, produce safe, competitive sparring pairs for
 * one or more rounds. Pairing aims to:
 *   1. match similar skill — students close in belt rank (then weight),
 *   2. avoid repeats — never pair the same two students twice across rounds
 *      while fresh partners remain,
 *   3. rotate byes — when the count is odd, the sit-out is spread across the
 *      session so no one is repeatedly benched.
 *
 * The result is deterministic for a given input ordering, so re-running yields
 * the same plan; callers introduce variety by changing rounds or the roster.
 */

export interface SparringParticipant {
  id: string;
  name: string;
  /** Belt rank order (higher = more senior). null/unranked sorts lowest. */
  beltOrder: number | null;
  /** Optional body weight (kg) for finer matching within a belt band. */
  weight?: number | null;
}

export interface SparringPairing {
  round: number;
  /** 1-based mat/station number within the round. */
  mat: number;
  a: SparringParticipant;
  /** null when `a` draws a bye (odd participant count). */
  b: SparringParticipant | null;
}

export interface SparringPlan {
  rounds: number;
  participantCount: number;
  pairings: SparringPairing[];
  /** Byes awarded, by round, for surfacing "sitting out" in the UI. */
  byes: { round: number; participantId: string }[];
}

/** Stable order key: belt order (unranked lowest), then weight, then name/id. */
function compareParticipants(
  a: SparringParticipant,
  b: SparringParticipant,
): number {
  const oa = a.beltOrder ?? -1;
  const ob = b.beltOrder ?? -1;
  if (oa !== ob) return oa - ob;
  const wa = a.weight ?? Number.POSITIVE_INFINITY;
  const wb = b.weight ?? Number.POSITIVE_INFINITY;
  if (wa !== wb) return wa - wb;
  if (a.name !== b.name) return a.name.localeCompare(b.name);
  return a.id.localeCompare(b.id);
}

/** Order-independent key for a pair, so (x,y) and (y,x) collide. */
function pairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
}

/** Mismatch cost between two participants — lower is a better-matched bout. */
function matchCost(a: SparringParticipant, b: SparringParticipant): number {
  const oa = a.beltOrder ?? -1;
  const ob = b.beltOrder ?? -1;
  // Belt gap dominates; weight gap refines ties within a belt band.
  let cost = Math.abs(oa - ob) * 10;
  if (a.weight != null && b.weight != null) {
    cost += Math.abs(a.weight - b.weight);
  }
  return cost;
}

/**
 * Pair a single round. Mutates `usedPairs` (to forbid repeats in later rounds)
 * and `byeCounts` (to rotate byes). Returns the round's pairings, byes last.
 */
function pairRound(
  round: number,
  participants: SparringParticipant[],
  usedPairs: Set<string>,
  byeCounts: Map<string, number>,
): SparringPairing[] {
  const pool = [...participants].sort(compareParticipants);

  // Odd roster → one bye, given to whoever has sat out least so far.
  let bye: SparringParticipant | null = null;
  if (pool.length % 2 === 1) {
    let pick = pool[0];
    for (const p of pool) {
      if ((byeCounts.get(p.id) ?? 0) < (byeCounts.get(pick.id) ?? 0)) pick = p;
    }
    bye = pick;
    byeCounts.set(pick.id, (byeCounts.get(pick.id) ?? 0) + 1);
    pool.splice(
      pool.findIndex((p) => p.id === pick.id),
      1,
    );
  }

  const remaining = [...pool];
  const pairings: SparringPairing[] = [];
  let mat = 1;

  while (remaining.length > 0) {
    const a = remaining.shift()!;
    // Best partner = lowest cost not already paired this session; fall back to
    // the lowest-cost partner overall once every fresh option is exhausted.
    let bestIdx = -1;
    let bestCost = Number.POSITIVE_INFINITY;
    let fallbackIdx = -1;
    let fallbackCost = Number.POSITIVE_INFINITY;
    for (let j = 0; j < remaining.length; j++) {
      const c = matchCost(a, remaining[j]);
      if (c < fallbackCost) {
        fallbackCost = c;
        fallbackIdx = j;
      }
      if (!usedPairs.has(pairKey(a.id, remaining[j].id)) && c < bestCost) {
        bestCost = c;
        bestIdx = j;
      }
    }
    const idx = bestIdx >= 0 ? bestIdx : fallbackIdx;
    const b = remaining.splice(idx, 1)[0];
    usedPairs.add(pairKey(a.id, b.id));
    pairings.push({ round, mat: mat++, a, b });
  }

  if (bye) pairings.push({ round, mat: mat++, a: bye, b: null });
  return pairings;
}

/**
 * Build a full sparring plan across `rounds` rounds. Repeats are avoided
 * cumulatively, so each subsequent round reaches for fresh matchups before
 * reusing an earlier pairing.
 */
export function generateSparringPlan(
  participants: SparringParticipant[],
  rounds = 1,
): SparringPlan {
  const totalRounds = Math.max(1, Math.floor(rounds));
  const usedPairs = new Set<string>();
  const byeCounts = new Map<string, number>();
  const pairings: SparringPairing[] = [];
  const byes: { round: number; participantId: string }[] = [];

  for (let r = 1; r <= totalRounds; r++) {
    for (const p of pairRound(r, participants, usedPairs, byeCounts)) {
      pairings.push(p);
      if (p.b === null) byes.push({ round: r, participantId: p.a.id });
    }
  }

  return {
    rounds: totalRounds,
    participantCount: participants.length,
    pairings,
    byes,
  };
}
