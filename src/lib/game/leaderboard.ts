import { eq, sql } from "drizzle-orm";
import { db, users, predictions, bonusAnswers, badges, standingsSnapshots } from "@/lib/db";

export interface LeaderboardRow {
  userId: number;
  username: string;
  displayName: string;
  avatar: string;
  matchPoints: number;
  bonusPoints: number;
  total: number;
  exactCount: number;
  predictionsCount: number;
  badgeCount: number;
  rank: number;
  /** Évolution vs le dernier snapshot quotidien (positif = a gagné des places) */
  movement: number;
}

export function computeLeaderboard(): LeaderboardRow[] {
  const allUsers = db.select().from(users).all();

  const matchPoints = db
    .select({
      userId: predictions.userId,
      pts: sql<number>`coalesce(sum(${predictions.points}), 0)`,
      exact: sql<number>`coalesce(sum(case when json_extract(${predictions.breakdown}, '$.exact') then 1 else 0 end), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(predictions)
    .groupBy(predictions.userId)
    .all();

  const bonusPoints = db
    .select({
      userId: bonusAnswers.userId,
      pts: sql<number>`coalesce(sum(${bonusAnswers.points}), 0)`,
    })
    .from(bonusAnswers)
    .groupBy(bonusAnswers.userId)
    .all();

  const badgeCounts = db
    .select({ userId: badges.userId, count: sql<number>`count(*)` })
    .from(badges)
    .groupBy(badges.userId)
    .all();

  const mpMap = new Map(matchPoints.map((r) => [r.userId, r]));
  const bpMap = new Map(bonusPoints.map((r) => [r.userId, r.pts]));
  const bcMap = new Map(badgeCounts.map((r) => [r.userId, r.count]));

  const rows = allUsers.map((u) => {
    const mp = mpMap.get(u.id);
    const matchPts = mp?.pts ?? 0;
    const bonusPts = bpMap.get(u.id) ?? 0;
    return {
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      matchPoints: matchPts,
      bonusPoints: bonusPts,
      total: matchPts + bonusPts,
      exactCount: mp?.exact ?? 0,
      predictionsCount: mp?.count ?? 0,
      badgeCount: bcMap.get(u.id) ?? 0,
      rank: 0,
      movement: 0,
    };
  });

  rows.sort(
    (a, b) => b.total - a.total || b.exactCount - a.exactCount || a.username.localeCompare(b.username),
  );
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  // Mouvement vs dernier snapshot
  const lastDay = db
    .select({ day: standingsSnapshots.day })
    .from(standingsSnapshots)
    .orderBy(sql`day desc`)
    .limit(1)
    .get();
  if (lastDay) {
    const snaps = db
      .select()
      .from(standingsSnapshots)
      .where(eq(standingsSnapshots.day, lastDay.day))
      .all();
    const prevRank = new Map(snaps.map((s) => [s.userId, s.rank]));
    for (const r of rows) {
      const prev = prevRank.get(r.userId);
      if (prev != null) r.movement = prev - r.rank;
    }
  }

  return rows;
}

/** Snapshot quotidien du classement (pour les flèches d'évolution et le badge Remontada). */
export function snapshotStandings(): void {
  const day = new Date().toISOString().slice(0, 10);
  const exists = db
    .select()
    .from(standingsSnapshots)
    .where(eq(standingsSnapshots.day, day))
    .get();
  if (exists) return;

  const rows = computeLeaderboard();
  for (const r of rows) {
    db.insert(standingsSnapshots)
      .values({ day, userId: r.userId, rank: r.rank, points: r.total })
      .onConflictDoNothing()
      .run();
  }
}
