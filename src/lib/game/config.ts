// Toutes les règles du jeu, au même endroit.

export const SCORING = {
  /** Score exact (remplace tendance + écart) */
  EXACT: 5,
  /** Bon vainqueur + bon écart de buts (ex: 2-1 prédit, 3-2 réel) */
  GOAL_DIFF: 3,
  /** Bonne tendance (victoire/nul/défaite) */
  TENDENCY: 2,
  /** Bonus outsider : bonne tendance alors que ≤ 25% du groupe y croyait */
  UNDERDOG: 1,
  /** Bonus série : à partir de 3 bonnes tendances d'affilée, +1 par match */
  STREAK: 1,
  /** Seuil de la série */
  STREAK_THRESHOLD: 3,
  /** En phase finale : qualifié correct quand on a prédit un nul */
  KO_QUALIFIER: 2,
  /** Part max du groupe ayant prédit la même tendance pour le bonus outsider */
  UNDERDOG_MAX_SHARE: 0.25,
  /** Nb min de pronostics sur le match pour activer le bonus outsider */
  UNDERDOG_MIN_PREDICTIONS: 4,
} as const;

export const BOOSTS = {
  double: { label: "Doublé", emoji: "✌️", multiplier: 2, initial: 4 },
  banco: { label: "Banco", emoji: "💰", multiplier: 3, initial: 1 },
} as const;

export type BoostKind = keyof typeof BOOSTS | "none";

export const GROUP_STAGE = "GROUP_STAGE";
export const KO_STAGES = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Phase de groupes",
  LAST_32: "16es de finale",
  LAST_16: "8es de finale",
  QUARTER_FINALS: "Quarts de finale",
  SEMI_FINALS: "Demi-finales",
  THIRD_PLACE: "Petite finale",
  FINAL: "Finale",
};

export function isKnockout(stage: string): boolean {
  return stage !== GROUP_STAGE;
}
