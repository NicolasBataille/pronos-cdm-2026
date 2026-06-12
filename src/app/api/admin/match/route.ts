import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, matches } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { ok, ApiError, parseBody, handler } from "@/lib/api";
import { tendencyOf } from "@/lib/game/scoring";
import { settleFinishedMatches } from "@/lib/game/settle";
import { broadcast } from "@/lib/realtime";

const schema = z.object({
  matchId: z.number().int().positive(),
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
  // Vainqueur officiel pour les nuls en phase finale (TAB)
  winnerSide: z.enum(["HOME_TEAM", "AWAY_TEAM"]).nullable().optional(),
  status: z.enum(["TIMED", "IN_PLAY", "FINISHED"]).default("FINISHED"),
});

/** Saisie manuelle d'un score par l'admin (mode sans API). */
export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, schema);

  const match = db.select().from(matches).where(eq(matches.id, body.matchId)).get();
  if (!match) throw new ApiError("Match introuvable.", 404);

  let winner: string | null = tendencyOf(body.homeScore, body.awayScore);
  if (winner === "DRAW" && body.winnerSide && match.stage !== "GROUP_STAGE") {
    winner = body.winnerSide;
  }

  db.update(matches)
    .set({
      homeScore: body.homeScore,
      awayScore: body.awayScore,
      winner,
      status: body.status,
      minute: body.status === "FINISHED" ? "FT" : body.status === "IN_PLAY" ? "live" : null,
      // Repasser un match en cours réinitialise le règlement
      settled: body.status === "FINISHED" ? match.settled : false,
    })
    .where(eq(matches.id, match.id))
    .run();

  broadcast({
    type: "match_update",
    payload: { matchId: match.id, status: body.status, home: body.homeScore, away: body.awayScore },
  });

  const settled = settleFinishedMatches();
  return ok({ settled });
});
