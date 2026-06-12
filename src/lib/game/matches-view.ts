import { eq, asc, sql } from "drizzle-orm";
import { db, matches, teams, predictions } from "@/lib/db";
import { isKnockout } from "./config";

export interface TeamView {
  id: number;
  name: string;
  tla: string;
  emblem: string | null;
  groupName: string | null;
}

export interface MatchView {
  id: number;
  stage: string;
  groupName: string | null;
  kickoff: string;
  status: string;
  minute: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  settled: boolean;
  locked: boolean;
  isKnockout: boolean;
  home: TeamView | null;
  away: TeamView | null;
  myPrediction: {
    homeScore: number;
    awayScore: number;
    koWinnerTeamId: number | null;
    boost: string;
    points: number | null;
    breakdown: string | null;
  } | null;
  predictionCount: number;
}

const LOCK_BEFORE_MS = 0; // verrouillage au coup d'envoi

export function getMatches(userId: number | null): MatchView[] {
  const rows = db.select().from(matches).orderBy(asc(matches.kickoff)).all();
  const allTeams = new Map(db.select().from(teams).all().map((t) => [t.id, t]));

  const counts = new Map(
    db
      .select({ matchId: predictions.matchId, c: sql<number>`count(*)` })
      .from(predictions)
      .groupBy(predictions.matchId)
      .all()
      .map((r) => [r.matchId, r.c]),
  );

  const myPreds = userId
    ? new Map(
        db
          .select()
          .from(predictions)
          .where(eq(predictions.userId, userId))
          .all()
          .map((p) => [p.matchId, p]),
      )
    : new Map();

  const now = Date.now();

  return rows.map((m) => {
    const home = m.homeTeamId ? allTeams.get(m.homeTeamId) : null;
    const away = m.awayTeamId ? allTeams.get(m.awayTeamId) : null;
    const locked = now >= m.kickoff.getTime() - LOCK_BEFORE_MS || m.status !== "TIMED";
    const mp = myPreds.get(m.id);

    return {
      id: m.id,
      stage: m.stage,
      groupName: m.groupName,
      kickoff: m.kickoff.toISOString(),
      status: m.status,
      minute: m.minute,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      winner: m.winner,
      settled: m.settled,
      locked,
      isKnockout: isKnockout(m.stage),
      home: home
        ? { id: home.id, name: home.name, tla: home.tla, emblem: home.emblem, groupName: home.groupName }
        : null,
      away: away
        ? { id: away.id, name: away.name, tla: away.tla, emblem: away.emblem, groupName: away.groupName }
        : null,
      myPrediction: mp
        ? {
            homeScore: mp.homeScore,
            awayScore: mp.awayScore,
            koWinnerTeamId: mp.koWinnerTeamId,
            boost: mp.boost,
            points: mp.points,
            breakdown: mp.breakdown,
          }
        : null,
      predictionCount: counts.get(m.id) ?? 0,
    };
  });
}
