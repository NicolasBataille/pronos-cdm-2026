import type { TeamView } from "@/lib/client/types";

export function TeamBadge({ team, size = "md" }: { team: TeamView | null; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "w-7 h-7 text-lg" : size === "lg" ? "w-14 h-14 text-3xl" : "w-10 h-10 text-2xl";

  if (!team) {
    return (
      <span className={`${dim} rounded-full bg-night-700 flex items-center justify-center text-white/30`}>
        ?
      </span>
    );
  }

  // Emoji drapeau (mode démo) vs URL d'emblème (API)
  const isEmoji = team.emblem && !team.emblem.startsWith("http");

  if (isEmoji) {
    return <span className={`${dim} flex items-center justify-center`}>{team.emblem}</span>;
  }
  if (team.emblem) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.emblem} alt={team.name} className={`${dim} object-contain`} />;
  }
  return (
    <span className={`${dim} rounded-full bg-night-700 flex items-center justify-center font-black text-xs`}>
      {team.tla}
    </span>
  );
}
