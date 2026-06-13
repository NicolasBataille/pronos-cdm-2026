import { SCORING } from "@/lib/game/config";
import { BADGE_DEFS } from "@/lib/game/badges";

export interface ScoringRule {
  emoji: string;
  title: string;
  detail: string;
  points: string;
  highlight?: boolean;
}

export const SCORING_RULES: ScoringRule[] = [
  {
    emoji: "🎯",
    title: "Score exact",
    detail: "Tu trouves le score pile poil. Le Graal.",
    points: `+${SCORING.EXACT}`,
    highlight: true,
  },
  {
    emoji: "📏",
    title: "Bon écart",
    detail: "Bon vainqueur ET bon écart de buts (tu dis 2-1, c'est 3-2).",
    points: `+${SCORING.GOAL_DIFF}`,
  },
  {
    emoji: "➡️",
    title: "Bonne tendance",
    detail: "Tu trouves juste le bon résultat : victoire, nul ou défaite.",
    points: `+${SCORING.TENDENCY}`,
  },
  {
    emoji: "🦄",
    title: "Bonus outsider",
    detail: `Tu as raison alors qu'au plus ${Math.round(
      SCORING.UNDERDOG_MAX_SHARE * 100,
    )}% du groupe y croyait.`,
    points: `+${SCORING.UNDERDOG}`,
  },
  {
    emoji: "🔥",
    title: "Bonus série",
    detail: `À partir de ${SCORING.STREAK_THRESHOLD} bonnes tendances d'affilée, chaque match en plus rapporte un bonus.`,
    points: `+${SCORING.STREAK}`,
  },
  {
    emoji: "🎟️",
    title: "Bon qualifié",
    detail: "En phase finale : tu prédis un nul ET la bonne équipe qui passe.",
    points: `+${SCORING.KO_QUALIFIER}`,
  },
];

export interface BoostInfo {
  emoji: string;
  name: string;
  mult: string;
  stock: string;
  detail: string;
  foil?: boolean;
}

export const BOOST_INFO: BoostInfo[] = [
  {
    emoji: "✌️",
    name: "Doublé",
    mult: "×2",
    stock: "4 jetons",
    detail: "Double les points d'un match. À poser sur un prono dont tu es plutôt sûr.",
  },
  {
    emoji: "💰",
    name: "Banco",
    mult: "×3",
    stock: "1 seul !",
    detail: "Triple les points. Tu n'en as qu'un pour tout le tournoi : garde-le pour LE match.",
    foil: true,
  },
];

export const BONUS_INFO = [
  { emoji: "🏆", title: "Champion du monde", detail: "Désigne le grand vainqueur. Validé tout seul à la finale." },
  { emoji: "🎟️", title: "Les deux finalistes", detail: "Les équipes de la finale. Moitié des points par finaliste correct." },
  { emoji: "👟", title: "Meilleur buteur", detail: "Le Soulier d'Or, validé par l'orga à la fin." },
];

export const GUIDE_BADGES = BADGE_DEFS;

export const GOLDEN_RULES = [
  "Tu peux modifier ton prono autant que tu veux… jusqu'au coup d'envoi. Après, c'est verrouillé.",
  "Un boost ne fait que multiplier des points gagnés : zéro reste zéro, jamais de points négatifs.",
  "Les scores et le classement se mettent à jour tout seuls, en direct, dès la fin des matchs.",
  "Réponds aux questions bonus avant le 1er match du tournoi : ce sont les plus gros points.",
];
