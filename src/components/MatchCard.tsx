"use client";

import { useState, useEffect } from "react";
import { useSWRConfig } from "swr";
import { post } from "@/lib/client/api";
import type { MatchView, Me } from "@/lib/client/types";
import { TeamBadge } from "./TeamBadge";
import { useToast } from "./Toasts";
import { formatKickoff, countdown, isLive, statusLabel } from "@/lib/client/format";

const BOOSTS = {
  none: { label: "Simple", emoji: "", mult: 1 },
  double: { label: "Doublé", emoji: "✌️", mult: 2 },
  banco: { label: "Banco", emoji: "💰", mult: 3 },
} as const;

export function MatchCard({ match, me }: { match: MatchView; me?: Me }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [home, setHome] = useState(match.myPrediction?.homeScore ?? 0);
  const [away, setAway] = useState(match.myPrediction?.awayScore ?? 0);
  const [boost, setBoost] = useState<string>(match.myPrediction?.boost ?? "none");
  const [koWinner, setKoWinner] = useState<number | null>(
    match.myPrediction?.koWinnerTeamId ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Resynchronise si le prono change côté serveur (ex: revalidation)
  useEffect(() => {
    if (!dirty) {
      setHome(match.myPrediction?.homeScore ?? 0);
      setAway(match.myPrediction?.awayScore ?? 0);
      setBoost(match.myPrediction?.boost ?? "none");
      setKoWinner(match.myPrediction?.koWinnerTeamId ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.myPrediction?.homeScore, match.myPrediction?.awayScore, match.myPrediction?.boost]);

  const live = isLive(match.status);
  const finished = match.status === "FINISHED";
  const needsKoWinner = match.isKnockout && home === away;

  async function save() {
    if (needsKoWinner && !koWinner) {
      toast("⚠️", "Choisis l'équipe qui se qualifie en cas de match nul !");
      return;
    }
    setSaving(true);
    try {
      await post("/api/predictions", {
        matchId: match.id,
        homeScore: home,
        awayScore: away,
        koWinnerTeamId: needsKoWinner ? koWinner : null,
        boost,
      });
      setDirty(false);
      toast("✅", "Prono enregistré !");
      mutate("/api/matches");
      mutate("/api/auth/me");
    } catch (err) {
      toast("❌", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  function changeScore(side: "home" | "away", delta: number) {
    setDirty(true);
    if (side === "home") setHome((v) => Math.max(0, Math.min(30, v + delta)));
    else setAway((v) => Math.max(0, Math.min(30, v + delta)));
  }

  const pred = match.myPrediction;
  const earned = pred?.points;
  const breakdown = pred?.breakdown ? JSON.parse(pred.breakdown) : null;

  return (
    <div
      className={`glass rounded-3xl p-4 ${
        live ? "ring-2 ring-magenta-500/40 animate-[pulse-ring_2s_infinite]" : ""
      }`}
    >
      {/* En-tête statut */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/40">
          {match.groupName ? `Groupe ${match.groupName}` : ""}
        </span>
        <StatusPill match={match} />
      </div>

      {/* Équipes + score */}
      <div className="flex items-center justify-between gap-2">
        <TeamSide team={match.home} align="left" />

        <div className="flex flex-col items-center shrink-0 px-1">
          {finished || live ? (
            <div className="flex items-center gap-2 text-3xl font-black">
              <span className={scoreColor(match, "home")}>{match.homeScore ?? 0}</span>
              <span className="text-white/30 text-xl">-</span>
              <span className={scoreColor(match, "away")}>{match.awayScore ?? 0}</span>
            </div>
          ) : (
            <span className="text-white/30 text-xl font-bold">vs</span>
          )}
        </div>

        <TeamSide team={match.away} align="right" />
      </div>

      {/* Zone de pronostic */}
      {!match.locked ? (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-center text-[11px] font-bold uppercase tracking-wider text-electric-400 mb-3">
            Ton pronostic
          </div>
          <div className="flex items-center justify-center gap-3">
            <Stepper value={home} onChange={(d) => changeScore("home", d)} />
            <span className="text-2xl font-black text-white/20">:</span>
            <Stepper value={away} onChange={(d) => changeScore("away", d)} />
          </div>

          {needsKoWinner && (
            <div className="mt-3">
              <div className="text-center text-[11px] text-gold-400 font-semibold mb-2">
                Nul prédit → qui se qualifie ?
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[match.home, match.away].map((t) =>
                  t ? (
                    <button
                      key={t.id}
                      onClick={() => { setKoWinner(t.id); setDirty(true); }}
                      className={`py-2 rounded-xl text-sm font-bold transition-all ${
                        koWinner === t.id
                          ? "bg-gold-500/30 ring-1 ring-gold-400 text-gold-200"
                          : "bg-night-900/40 text-white/60"
                      }`}
                    >
                      {t.tla}
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Boosts */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["none", "double", "banco"] as const).map((b) => {
              const def = BOOSTS[b];
              const stock =
                b === "double" ? me?.doublesLeft ?? 0 : b === "banco" ? me?.bancosLeft ?? 0 : 99;
              const owned = boost === b;
              const usable = b === "none" || owned || stock > 0;
              return (
                <button
                  key={b}
                  disabled={!usable}
                  onClick={() => { setBoost(b); setDirty(true); }}
                  className={`relative py-2 rounded-xl text-xs font-bold transition-all ${
                    owned
                      ? b === "banco"
                        ? "bg-gradient-to-br from-gold-500 to-gold-400 text-night-900"
                        : b === "double"
                          ? "bg-gradient-to-br from-electric-500 to-electric-400 text-night-900"
                          : "bg-white/15 text-white"
                      : usable
                        ? "bg-night-900/40 text-white/60"
                        : "bg-night-900/20 text-white/20 cursor-not-allowed"
                  }`}
                >
                  <div>{def.emoji} {def.label}</div>
                  {b !== "none" && (
                    <div className="text-[9px] opacity-70 font-semibold">
                      ×{def.mult} · reste {b === "double" ? me?.doublesLeft ?? 0 : me?.bancosLeft ?? 0}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className={`w-full mt-4 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${
              dirty
                ? "bg-gradient-to-r from-pitch-500 to-pitch-600 text-white shadow-lg shadow-pitch-500/20"
                : "bg-night-900/40 text-white/50"
            }`}
          >
            {saving ? "..." : dirty ? "Valider mon prono ✅" : pred ? "Prono enregistré ✓" : "Valider"}
          </button>
          <Deadline iso={match.kickoff} />
        </div>
      ) : (
        <LockedPrediction match={match} earned={earned} breakdown={breakdown} />
      )}
    </div>
  );
}

function StatusPill({ match }: { match: MatchView }) {
  const live = isLive(match.status);
  if (live) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-black text-magenta-400">
        <span className="w-2 h-2 rounded-full bg-magenta-500 animate-pulse" />
        {statusLabel(match.status, match.minute)}
      </span>
    );
  }
  if (match.status === "FINISHED") {
    return <span className="text-xs font-bold text-white/40">Terminé</span>;
  }
  return <span className="text-xs font-semibold text-white/50">{formatKickoff(match.kickoff)}</span>;
}

function TeamSide({ team, align }: { team: MatchView["home"]; align: "left" | "right" }) {
  return (
    <div className={`flex-1 flex items-center gap-2 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <TeamBadge team={team} size="lg" />
      <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
        <div className="font-bold text-sm text-white/90 truncate leading-tight">
          {team?.name ?? "À déterminer"}
        </div>
        <div className="text-[10px] text-white/40 font-semibold">{team?.tla}</div>
      </div>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => onChange(1)}
        className="w-12 h-8 rounded-xl bg-night-700/60 text-white/70 font-black text-lg active:scale-90 hover:bg-night-600 transition-all flex items-center justify-center"
      >
        +
      </button>
      <div className="w-16 h-16 rounded-2xl bg-night-900/60 border border-white/10 flex items-center justify-center text-4xl font-black tabular-nums">
        {value}
      </div>
      <button
        onClick={() => onChange(-1)}
        className="w-12 h-8 rounded-xl bg-night-700/60 text-white/70 font-black text-lg active:scale-90 hover:bg-night-600 transition-all flex items-center justify-center"
      >
        −
      </button>
    </div>
  );
}

function Deadline({ iso }: { iso: string }) {
  const cd = countdown(iso);
  if (!cd) return null;
  return (
    <p className="text-center text-[11px] text-white/30 mt-2">
      ⏳ Verrouillage au coup d&apos;envoi · {cd}
    </p>
  );
}

function LockedPrediction({
  match,
  earned,
  breakdown,
}: {
  match: MatchView;
  earned: number | null | undefined;
  breakdown: { multiplier?: number } | null;
}) {
  const pred = match.myPrediction;

  if (!pred) {
    return (
      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-sm text-white/30">😴 Pas de prono sur ce match</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-semibold">Ton prono :</span>
          <span className="text-sm font-black bg-night-900/50 px-2.5 py-1 rounded-lg tabular-nums">
            {pred.homeScore} - {pred.awayScore}
          </span>
          {pred.boost !== "none" && (
            <span className="text-xs">{pred.boost === "banco" ? "💰" : "✌️"}</span>
          )}
        </div>
        {match.settled && earned != null && (
          <span
            className={`text-sm font-black px-2.5 py-1 rounded-lg ${
              earned > 0
                ? "bg-pitch-500/20 text-pitch-50"
                : "bg-magenta-500/15 text-magenta-300"
            }`}
          >
            {earned > 0 ? `+${earned}` : "0"} pts
          </span>
        )}
      </div>
      {match.settled && pred.breakdown && (
        <p className="text-[11px] text-white/40 mt-2">{describeBreakdown(pred.breakdown)}</p>
      )}
      {!match.settled && (
        <p className="text-[11px] text-white/30 mt-2">⏱️ En attente du résultat...</p>
      )}
    </div>
  );
}

function describeBreakdown(json: string): string {
  try {
    const b = JSON.parse(json);
    const parts: string[] = [];
    if (b.exact) parts.push("🎯 Score exact +5");
    else if (b.goalDiff) parts.push("Bon écart +3");
    else if (b.tendency) parts.push("Bonne tendance +2");
    if (b.koQualifier) parts.push("Bon qualifié +2");
    if (b.underdog) parts.push("🦄 Outsider +1");
    if (b.streak) parts.push("🔥 Série +1");
    if (parts.length === 0) parts.push("Raté cette fois !");
    if (b.multiplier > 1) parts.push(`boost ×${b.multiplier}`);
    return parts.join(" · ");
  } catch {
    return "";
  }
}

function scoreColor(match: MatchView, side: "home" | "away"): string {
  if (match.status !== "FINISHED") return "text-white";
  const h = match.homeScore ?? 0;
  const a = match.awayScore ?? 0;
  const won = side === "home" ? h > a : a > h;
  return won ? "text-gold-400" : "text-white/70";
}
