"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/api";
import type { LeaderboardRow, Me } from "@/lib/client/types";

export function Leaderboard({ me }: { me?: Me }) {
  const { data: rows, isLoading } = useSWR<LeaderboardRow[]>("/api/leaderboard", fetcher, {
    refreshInterval: 30_000,
  });

  if (isLoading) return <Skeleton />;
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-xl font-black">Classement vide</h2>
        <p className="text-white/50 text-sm mt-1">Les points arrivent dès le premier match joué !</p>
      </div>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="pt-2">
      <h1 className="text-2xl font-black mb-1 text-center">
        <span className="shimmer-gold">Classement général</span>
      </h1>
      <p className="text-center text-white/40 text-xs mb-6">Mis à jour en temps réel ⚡</p>

      <Podium podium={podium} meId={me?.id} />

      <div className="space-y-2 mt-4">
        {rest.map((r) => (
          <Row key={r.userId} row={r} isMe={r.userId === me?.id} />
        ))}
      </div>
    </div>
  );
}

function Podium({ podium, meId }: { podium: LeaderboardRow[]; meId?: number }) {
  const [first, second, third] = podium;
  const order = [second, first, third].filter(Boolean);
  const heights = { 1: "h-28", 2: "h-20", 3: "h-16" } as Record<number, string>;
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" } as Record<number, string>;

  return (
    <div className="flex items-end justify-center gap-2">
      {order.map((r) => (
        <div key={r.userId} className="flex-1 max-w-28 flex flex-col items-center">
          <div className="text-3xl mb-1">{medals[r.rank]}</div>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1 ${
              r.rank === 1 ? "ring-2 ring-gold-400 bg-gold-500/20" : "bg-night-700"
            } ${r.userId === meId ? "ring-2 ring-electric-400" : ""}`}
          >
            {r.avatar}
          </div>
          <div className="text-xs font-bold truncate max-w-full text-center px-1">
            {r.displayName}
          </div>
          <div className="text-lg font-black gold-text">{r.total}</div>
          <div
            className={`w-full ${heights[r.rank]} rounded-t-2xl mt-1 flex items-start justify-center pt-2 ${
              r.rank === 1
                ? "bg-gradient-to-t from-gold-500/40 to-gold-400/10"
                : "bg-gradient-to-t from-night-600/60 to-night-700/20"
            }`}
          >
            <span className="text-2xl font-black text-white/20">{r.rank}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-3 ${
        isMe ? "glass-strong ring-1 ring-electric-400/40" : "glass"
      }`}
    >
      <span className="w-7 text-center font-black text-white/40 tabular-nums">{row.rank}</span>
      <Movement value={row.movement} />
      <span className="w-9 h-9 rounded-full bg-night-700 flex items-center justify-center text-lg shrink-0">
        {row.avatar}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">
          {row.displayName} {isMe && <span className="text-electric-400 text-xs">(toi)</span>}
        </div>
        <div className="text-[11px] text-white/40 flex items-center gap-2">
          {row.exactCount > 0 && <span>🎯 {row.exactCount}</span>}
          {row.badgeCount > 0 && <span>🏅 {row.badgeCount}</span>}
          <span>{row.predictionsCount} pronos</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-lg font-black gold-text tabular-nums">{row.total}</div>
        {row.bonusPoints > 0 && (
          <div className="text-[10px] text-electric-400">dont {row.bonusPoints} bonus</div>
        )}
      </div>
    </div>
  );
}

function Movement({ value }: { value: number }) {
  if (value === 0) return <span className="w-4 text-white/20 text-xs">–</span>;
  const up = value > 0;
  return (
    <span className={`w-4 text-xs font-bold ${up ? "text-pitch-500" : "text-magenta-400"}`}>
      {up ? "▲" : "▼"}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 mt-10">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="glass rounded-2xl h-14 animate-pulse opacity-50" />
      ))}
    </div>
  );
}
