export interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: "sniper", emoji: "🎯", label: "Sniper", description: "Premier score exact" },
  { id: "nostradamus", emoji: "🔮", label: "Nostradamus", description: "3 scores exacts" },
  { id: "madame_irma", emoji: "🧙", label: "Madame Irma", description: "7 scores exacts" },
  { id: "pyromane", emoji: "🔥", label: "Pyromane", description: "Série de 5 bonnes tendances" },
  { id: "clown", emoji: "🤡", label: "Clown", description: "5 pronos ratés d'affilée" },
  { id: "touriste", emoji: "🛋️", label: "Touriste", description: "5 matchs oubliés (sans prono)" },
  { id: "licorne", emoji: "🦄", label: "Licorne", description: "3 bonus outsider décrochés" },
  { id: "banco_or", emoji: "💰", label: "Jackpot", description: "Un Banco ×3 gagné avec score exact" },
  { id: "premier_sang", emoji: "🩸", label: "Premier sang", description: "Premier prono validé du tournoi" },
  { id: "comeback", emoji: "🚀", label: "Remontada", description: "Gagner 3 places au classement en un jour" },
];

export const BADGE_MAP = new Map(BADGE_DEFS.map((b) => [b.id, b]));
