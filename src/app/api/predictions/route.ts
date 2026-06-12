import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, matches, predictions, users } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, ApiError, parseBody, handler } from "@/lib/api";
import { BOOSTS } from "@/lib/game/config";
import { pushEvent } from "@/lib/game/feed";
import { broadcast } from "@/lib/realtime";

const schema = z.object({
  matchId: z.number().int().positive(),
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
  koWinnerTeamId: z.number().int().positive().nullable().optional(),
  boost: z.enum(["none", "double", "banco"]).default("none"),
});

export const POST = handler(async (req) => {
  const session = await requireUser();
  const body = await parseBody(req, schema);

  const match = db.select().from(matches).where(eq(matches.id, body.matchId)).get();
  if (!match) throw new ApiError("Match introuvable.", 404);

  // Verrouillage : impossible de pronostiquer après le coup d'envoi
  if (Date.now() >= match.kickoff.getTime() || match.status !== "TIMED") {
    throw new ApiError("Trop tard, ce match a déjà commencé !", 409);
  }

  // En phase finale, si nul prédit, exiger le choix du qualifié
  let koWinnerTeamId: number | null = null;
  if (match.stage !== "GROUP_STAGE" && body.homeScore === body.awayScore) {
    if (
      !body.koWinnerTeamId ||
      (body.koWinnerTeamId !== match.homeTeamId && body.koWinnerTeamId !== match.awayTeamId)
    ) {
      throw new ApiError("Match nul en phase finale : choisis l'équipe qui se qualifie.", 422);
    }
    koWinnerTeamId = body.koWinnerTeamId;
  }

  const user = db.select().from(users).where(eq(users.id, session.id)).get()!;
  const existing = db
    .select()
    .from(predictions)
    .where(and(eq(predictions.userId, session.id), eq(predictions.matchId, body.matchId)))
    .get();

  const prevBoost = existing?.boost ?? "none";
  const newBoost = body.boost;

  // Gestion du stock de boosts (un boost = jeton consommé, restitué si on change d'avis)
  if (newBoost !== prevBoost) {
    validateBoostStock(user.doublesLeft, user.bancosLeft, prevBoost, newBoost);
    const { doubles, bancos } = applyBoostDelta(
      user.doublesLeft,
      user.bancosLeft,
      prevBoost,
      newBoost,
    );
    db.update(users).set({ doublesLeft: doubles, bancosLeft: bancos }).where(eq(users.id, user.id)).run();

    if (newBoost !== "none") {
      pushEvent("boost_used", {
        emoji: BOOSTS[newBoost].emoji,
        message: `${session.displayName} pose un ${BOOSTS[newBoost].label} ${BOOSTS[newBoost].emoji} sur un match !`,
        userId: session.id,
      });
    }
  }

  const now = new Date();
  if (existing) {
    db.update(predictions)
      .set({
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        koWinnerTeamId,
        boost: newBoost,
        updatedAt: now,
      })
      .where(eq(predictions.id, existing.id))
      .run();
  } else {
    db.insert(predictions)
      .values({
        userId: session.id,
        matchId: body.matchId,
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        koWinnerTeamId,
        boost: newBoost,
        updatedAt: now,
      })
      .run();
  }

  broadcast({ type: "feed" });
  return ok({ saved: true });
});

function validateBoostStock(
  doubles: number,
  bancos: number,
  prev: string,
  next: string,
): void {
  if (next === "double" && prev !== "double" && doubles <= 0) {
    throw new ApiError("Tu n'as plus de Doublé disponible.", 409);
  }
  if (next === "banco" && prev !== "banco" && bancos <= 0) {
    throw new ApiError("Tu n'as plus de Banco disponible.", 409);
  }
}

function applyBoostDelta(
  doubles: number,
  bancos: number,
  prev: string,
  next: string,
): { doubles: number; bancos: number } {
  let d = doubles;
  let b = bancos;
  if (prev === "double") d += 1;
  if (prev === "banco") b += 1;
  if (next === "double") d -= 1;
  if (next === "banco") b -= 1;
  return { doubles: Math.max(0, d), bancos: Math.max(0, b) };
}
