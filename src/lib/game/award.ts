import { and, eq, desc, inArray, isNotNull } from "drizzle-orm";
import { db, badges, matches, predictions, users } from "@/lib/db";
import { BADGE_MAP } from "./badges";
import { broadcast } from "@/lib/realtime";
import { pushEvent } from "./feed";

interface StoredBreakdown {
  exact: boolean;
  underdog: boolean;
  tendencyOk: boolean;
  multiplier: number;
  total: number;
}

/** Vérifie et attribue les badges d'un joueur après un règlement de match. */
export function checkBadgesForUser(userId: number): void {
  const settled = db
    .select({
      breakdown: predictions.breakdown,
      kickoff: matches.kickoff,
    })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(
      and(
        eq(predictions.userId, userId),
        eq(matches.settled, true),
        isNotNull(predictions.breakdown),
      ),
    )
    .orderBy(desc(matches.kickoff))
    .all();

  const parsed = settled.map((s) => JSON.parse(s.breakdown!) as StoredBreakdown);

  const exactCount = parsed.filter((b) => b.exact).length;
  const underdogCount = parsed.filter((b) => b.underdog).length;
  const bancoExact = parsed.some((b) => b.exact && b.multiplier === 3);

  // Séries (du plus récent au plus ancien)
  let currentStreak = 0;
  for (const b of parsed) {
    if (b.tendencyOk) currentStreak += 1;
    else break;
  }
  let missStreak = 0;
  for (const b of parsed) {
    if (!b.tendencyOk) missStreak += 1;
    else break;
  }

  // Matchs terminés sans prono
  const finished = db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.settled, true))
    .all();
  const finishedIds = finished.map((m) => m.id);
  const predicted =
    finishedIds.length === 0
      ? []
      : db
          .select({ matchId: predictions.matchId })
          .from(predictions)
          .where(
            and(eq(predictions.userId, userId), inArray(predictions.matchId, finishedIds)),
          )
          .all();
  const missedCount = finishedIds.length - predicted.length;

  if (exactCount >= 1) award(userId, "sniper");
  if (exactCount >= 3) award(userId, "nostradamus");
  if (exactCount >= 7) award(userId, "madame_irma");
  if (currentStreak >= 5) award(userId, "pyromane");
  if (missStreak >= 5) award(userId, "clown");
  if (missedCount >= 5) award(userId, "touriste");
  if (underdogCount >= 3) award(userId, "licorne");
  if (bancoExact) award(userId, "banco_or");
  if (parsed.length >= 1 && finishedIds.length === 1 && parsed[0].total > 0) {
    award(userId, "premier_sang");
  }
}

export function award(userId: number, badgeId: string): boolean {
  const def = BADGE_MAP.get(badgeId);
  if (!def) return false;
  const existing = db
    .select()
    .from(badges)
    .where(and(eq(badges.userId, userId), eq(badges.badgeId, badgeId)))
    .get();
  if (existing) return false;

  db.insert(badges).values({ userId, badgeId, awardedAt: new Date() }).run();

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  pushEvent("badge", {
    emoji: def.emoji,
    message: `${user?.displayName ?? "?"} débloque le badge ${def.emoji} « ${def.label} » — ${def.description}`,
    userId,
    badgeId,
  });
  broadcast({ type: "badge", payload: { userId, badgeId } });
  return true;
}
