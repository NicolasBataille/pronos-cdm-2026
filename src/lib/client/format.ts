export const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Phase de groupes",
  LAST_32: "16es de finale",
  LAST_16: "8es de finale",
  QUARTER_FINALS: "Quarts de finale",
  SEMI_FINALS: "Demi-finales",
  THIRD_PLACE: "Petite finale",
  FINAL: "Finale",
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Aujourd'hui ${time}`;
  if (isTomorrow) return `Demain ${time}`;
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function countdown(iso: string): string | null {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `dans ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `dans ${hours}h`;
  const days = Math.floor(hours / 24);
  return `dans ${days}j`;
}

export function isLive(status: string): boolean {
  return status === "IN_PLAY" || status === "PAUSED";
}

export function statusLabel(status: string, minute: string | null): string {
  switch (status) {
    case "IN_PLAY":
      return minute ? minute : "EN DIRECT";
    case "PAUSED":
      return "Mi-temps";
    case "FINISHED":
      return "Terminé";
    case "POSTPONED":
      return "Reporté";
    default:
      return "À venir";
  }
}
