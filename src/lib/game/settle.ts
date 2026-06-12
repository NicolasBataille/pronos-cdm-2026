import { and, eq, lt, desc, inArray } from "drizzle-orm";
import { db, matches, predictions, users } from "@/lib/db";
import { scorePrediction, tendencyOf, type Outcome, type ScoreBreakdown } from "./scoring";
import { broadcast } from "@/lib/realtime";
import { checkBadgesForUser } from "./award";
import { settleBonusQuestions } from "./settle-bonus";
import { pushEvent } from "./feed";

type Match = typeof matches.$inferSelect;

interface StoredBreakdown extends ScoreBreakdown {
  tendencyOk: boolean;
}

/** Règle tous les matchs terminés non encore comptabilisés. */
export function settleFinishedMatches(): number {
  const toSettle = db
    .select()
    .from(matches)
    .where(and(eq(matches.status, "FINISHED"), eq(matches.settled, false)))
    .all();

  for (const match of toSettle) {
    settleMatch(match);
  }
  if (toSettle.length > 0) {
    settleBonusQuestions();
    broadcast({ type: "leaderboard" });
  }
  return toSettle.length;
}

function settleMatch(match: Match): void {
  if (match.homeScore == null || match.awayScore == null) return;
  const winner =
    (match.winner as Outcome | null) ?? tendencyOf(match.homeScore, match.awayScore);

  const preds = db.select().from(predictions).where(eq(predictions.matchId, match.id)).all();
  const allTendencies = preds.map((p) => tendencyOf(p.homeScore, p.awayScore));

  const result = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    winner,
    stage: match.stage,
  };

  const allUsers = db.select().from(users).all();

  for (const pred of preds) {
    const koWinnerSide =
      pred.koWinnerTeamId == null
        ? null
        : pred.koWinnerTeamId === match.homeTeamId
          ? ("HOME_TEAM" as const)
          : ("AWAY_TEAM" as const);

    const breakdown = scorePrediction(
      {
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
        koWinnerSide,
        boost: pred.boost as "none" | "double" | "banco",
      },
      result,
      {
        allTendencies,
        streakBefore: getStreakBefore(pred.userId, match.kickoff),
      },
    );

    const stored: StoredBreakdown = {
      ...breakdown,
      tendencyOk: breakdown.exact || breakdown.goalDiff || breakdown.tendency,
    };

    db.update(predictions)
      .set({ points: breakdown.total, breakdown: JSON.stringify(stored) })
      .where(eq(predictions.id, pred.id))
      .run();

    if (breakdown.exact) {
      const user = allUsers.find((u) => u.id === pred.userId);
      pushEvent("exact_score", {
        emoji: "🎯",
        message: `${user?.displayName ?? "?"} a trouvé le score exact${
          breakdown.multiplier > 1 ? ` avec un boost ×${breakdown.multiplier} !` : " !"
        } (+${breakdown.total} pts)`,
        userId: pred.userId,
      });
    }
  }

  db.update(matches).set({ settled: true }).where(eq(matches.id, match.id)).run();

  pushEvent("match_settled", {
    emoji: "✅",
    message: `Match terminé : pronostics comptabilisés (${match.homeScore}-${match.awayScore}).`,
    matchId: match.id,
  });

  for (const u of allUsers) {
    checkBadgesForUser(u.id);
  }

  broadcast({ type: "match_settled", payload: { matchId: match.id } });
}

/**
 * Longueur de la série de bonnes tendances juste avant ce match.
 * Un match terminé sans prono casse la série.
 */
export function getStreakBefore(userId: number, kickoff: Date): number {
  const prior = db
    .select({
      matchId: matches.id,
    })
    .from(matches)
    .where(and(eq(matches.settled, true), lt(matches.kickoff, kickoff)))
    .orderBy(desc(matches.kickoff))
    .limit(30)
    .all();

  if (prior.length === 0) return 0;

  const ids = prior.map((m) => m.matchId);
  const preds = db
    .select()
    .from(predictions)
    .where(and(eq(predictions.userId, userId), inArray(predictions.matchId, ids)))
    .all();
  const byMatch = new Map(preds.map((p) => [p.matchId, p]));

  let streak = 0;
  for (const m of prior) {
    const pred = byMatch.get(m.matchId);
    if (!pred?.breakdown) break;
    const b = JSON.parse(pred.breakdown) as StoredBreakdown;
    if (!b.tendencyOk) break;
    streak += 1;
  }
  return streak;
}

