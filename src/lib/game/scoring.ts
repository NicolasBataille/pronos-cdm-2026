import { SCORING, BOOSTS, type BoostKind, isKnockout } from "./config";

export type Outcome = "HOME_TEAM" | "AWAY_TEAM" | "DRAW";

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  /** Vainqueur officiel (prolongations / tirs au but inclus) */
  winner: Outcome;
  stage: string;
}

export interface PredictionInput {
  homeScore: number;
  awayScore: number;
  /** Équipe qualifiée choisie si nul prédit en phase finale */
  koWinnerSide?: "HOME_TEAM" | "AWAY_TEAM" | null;
  boost: BoostKind;
}

export interface ScoreContext {
  /** Tendances prédites par tout le groupe sur ce match (pour le bonus outsider) */
  allTendencies: Outcome[];
  /** Longueur de la série de bonnes tendances AVANT ce match */
  streakBefore: number;
}

export interface ScoreBreakdown {
  base: number;
  exact: boolean;
  goalDiff: boolean;
  tendency: boolean;
  koQualifier: boolean;
  underdog: boolean;
  streak: boolean;
  multiplier: number;
  total: number;
}

export function tendencyOf(home: number, away: number): Outcome {
  if (home > away) return "HOME_TEAM";
  if (home < away) return "AWAY_TEAM";
  return "DRAW";
}

/**
 * Tendance réelle d'un match : sur 90 minutes pour la phase de groupes,
 * vainqueur officiel (prolongations/TAB compris) en phase finale.
 * Le score utilisé pour l'exactitude est le score temps réglementaire + prolongations
 * tel que fourni par l'API ; un nul au score avec un vainqueur officiel = TAB.
 */
export function actualTendency(result: MatchResult): Outcome {
  const scoreTendency = tendencyOf(result.homeScore, result.awayScore);
  return scoreTendency;
}

export function scorePrediction(
  pred: PredictionInput,
  result: MatchResult,
  ctx: ScoreContext,
): ScoreBreakdown {
  const predTendency = tendencyOf(pred.homeScore, pred.awayScore);
  const realTendency = actualTendency(result);

  const exact = pred.homeScore === result.homeScore && pred.awayScore === result.awayScore;
  const sameTendency = predTendency === realTendency;
  const sameDiff =
    sameTendency && pred.homeScore - pred.awayScore === result.homeScore - result.awayScore;

  let base = 0;
  let goalDiff = false;
  let tendency = false;
  if (exact) {
    base = SCORING.EXACT;
  } else if (sameDiff && realTendency !== "DRAW") {
    // Un nul avec le bon écart (0-0 prédit, 1-1 réel) reste une simple tendance
    base = SCORING.GOAL_DIFF;
    goalDiff = true;
  } else if (sameTendency) {
    base = SCORING.TENDENCY;
    tendency = true;
  }

  // Phase finale : nul prédit + bon qualifié choisi
  let koQualifier = false;
  if (
    isKnockout(result.stage) &&
    predTendency === "DRAW" &&
    realTendency === "DRAW" &&
    pred.koWinnerSide &&
    pred.koWinnerSide === result.winner
  ) {
    base += SCORING.KO_QUALIFIER;
    koQualifier = true;
  }

  // Bonus outsider : avoir raison contre la majorité
  let underdog = false;
  if (
    sameTendency &&
    base > 0 &&
    ctx.allTendencies.length >= SCORING.UNDERDOG_MIN_PREDICTIONS
  ) {
    const share =
      ctx.allTendencies.filter((t) => t === predTendency).length / ctx.allTendencies.length;
    if (share <= SCORING.UNDERDOG_MAX_SHARE) {
      base += SCORING.UNDERDOG;
      underdog = true;
    }
  }

  // Bonus série : 3e bonne tendance consécutive et au-delà
  let streak = false;
  if (sameTendency && ctx.streakBefore + 1 >= SCORING.STREAK_THRESHOLD) {
    base += SCORING.STREAK;
    streak = true;
  }

  const multiplier = pred.boost === "none" ? 1 : BOOSTS[pred.boost].multiplier;
  // Le boost ne multiplie que si des points ont été marqués (pas de malus)
  const total = base * multiplier;

  return { base, exact, goalDiff, tendency, koQualifier, underdog, streak, multiplier, total };
}

export function describeBreakdown(b: ScoreBreakdown): string {
  const parts: string[] = [];
  if (b.exact) parts.push(`Score exact +${SCORING.EXACT}`);
  if (b.goalDiff) parts.push(`Bon écart +${SCORING.GOAL_DIFF}`);
  if (b.tendency) parts.push(`Bonne tendance +${SCORING.TENDENCY}`);
  if (b.koQualifier) parts.push(`Bon qualifié +${SCORING.KO_QUALIFIER}`);
  if (b.underdog) parts.push(`Outsider +${SCORING.UNDERDOG}`);
  if (b.streak) parts.push(`Série 🔥 +${SCORING.STREAK}`);
  if (parts.length === 0) parts.push("Raté !");
  if (b.multiplier > 1) parts.push(`×${b.multiplier}`);
  return parts.join(" · ");
}
