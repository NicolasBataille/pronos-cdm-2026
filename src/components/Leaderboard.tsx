"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/api";
import type { LeaderboardRow, Me } from "@/lib/client/types";
import { AnimatedNumber } from "./ui/AnimatedNumber";

export function Leaderboard({ me }: { me?: Me }) {
  const { data: rows, isLoading } = useSWR<LeaderboardRow[]>("/api/leaderboard", fetcher, {
    refreshInterval: 30_000,
  });

  if (isLoading) return <Skeleton />;
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-24 animate-rise">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="display text-2xl font-extrabold">Classement vide</h2>
        <p className="text-bone-faint text-sm mt-1">Les points arrivent dès le premier match joué.</p>
      </div>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="pt-1">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-lime-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">
          <span className="h-px w-5 bg-lime-400" />
          Temps réel
        </div>
        <h1 className="display text-3xl font-extrabold tracking-tight">Le classement</h1>
      </header>

      <Podium podium={podium} meId={me?.id} />

      {rest.length > 0 && (
        <div className="mt-5 space-y-1.5">
          {rest.map((r, i) => (
            <div key={r.userId} className="animate-rise" style={{ animationDelay: `${i * 35}ms` }}>
              <Row row={r} isMe={r.userId === me?.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Podium({ podium, meId }: { podium: LeaderboardRow[]; meId?: number }) {
  const [first, second, third] = podium;
  const order = [second, first, third].filter(Boolean);
  const heights = { 1: "h-24", 2: "h-16", 3: "h-12" } as Record<number, string>;
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" } as Record<number, string>;

  return (
    <div className="flex items-end justify-center gap-2.5">
      {order.map((r) => {
        const isFirst = r.rank === 1;
        return (
          <div key={r.userId} className="flex-1 max-w-28 flex flex-col items-center animate-rise">
            <span className="text-2xl mb-1">{medals[r.rank]}</span>
            <div
              className={`w-13 h-13 rounded-xl flex items-center justify-center text-2xl mb-1.5 ${
                isFirst ? "ring-2 ring-lime-400 bg-lime-400/10" : "bg-ink-800 ring-1 ring-line"
              } ${r.userId === meId ? "outline outline-1 outline-offset-2 outline-line" : ""}`}
              style={{ width: "3.25rem", height: "3.25rem" }}
            >
              {r.avatar}
            </div>
            <div className="font-bold text-xs truncate max-w-full text-center px-1 text-bone">
              {r.displayName}
            </div>
            <div className={`display text-xl font-extrabold ${isFirst ? "text-lime-400" : "text-bone"}`}>
              <AnimatedNumber value={r.total} />
            </div>
            <div
              className={`relative w-full ${heights[r.rank]} rounded-t-lg mt-1.5 flex items-start justify-center pt-1.5 ${
                isFirst ? "bg-lime-400/10 border-t-2 border-lime-400" : "bg-ink-800 border-t border-line"
              }`}
            >
              <span className="display text-2xl font-extrabold text-bone-faint/25 num">{r.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 surface ${
        isMe ? "ring-1 ring-lime-400/40" : ""
      }`}
    >
      <span className="display w-6 text-center font-extrabold text-bone-faint num">{row.rank}</span>
      <Movement value={row.movement} />
      <span className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center text-lg shrink-0">
        {row.avatar}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate text-bone">
          {row.displayName} {isMe && <span className="text-lime-400 text-xs font-semibold">· toi</span>}
        </div>
        <div className="text-[11px] text-bone-faint flex items-center gap-2.5">
          {row.exactCount > 0 && <span>🎯 {row.exactCount}</span>}
          {row.badgeCount > 0 && <span>🏅 {row.badgeCount}</span>}
          <span className="num">{row.predictionsCount} pronos</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="display text-lg font-extrabold text-bone">
          <AnimatedNumber value={row.total} />
        </div>
        {row.bonusPoints > 0 && (
          <div className="text-[10px] text-lime-400 num">+{row.bonusPoints} bonus</div>
        )}
      </div>
    </div>
  );
}

function Movement({ value }: { value: number }) {
  if (value === 0) return <span className="w-3 text-bone-faint/30 text-xs text-center">·</span>;
  const up = value > 0;
  return (
    <span className={`w-3 text-[11px] font-bold text-center ${up ? "text-lime-400" : "text-tomato"}`}>
      {up ? "▲" : "▼"}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 mt-10">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="surface rounded-xl h-14 animate-pulse opacity-40" />
      ))}
    </div>
  );
}
