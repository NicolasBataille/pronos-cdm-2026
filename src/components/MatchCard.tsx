"use client";

import { useState, useEffect } from "react";
import { useSWRConfig } from "swr";
import { post } from "@/lib/client/api";
import type { MatchView, Me } from "@/lib/client/types";
import { TeamBadge } from "./TeamBadge";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { useToast } from "./Toasts";
import { formatKickoff, countdown, isLive } from "@/lib/client/format";

const BOOSTS = {
  none: { label: "Simple", mult: 1 },
  double: { label: "Doublé", mult: 2 },
  banco: { label: "Banco", mult: 3 },
} as const;

export function MatchCard({ match, me }: { match: MatchView; me?: Me }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const [home, setHome] = useState(match.myPrediction?.homeScore ?? 0);
  const [away, setAway] = useState(match.myPrediction?.awayScore ?? 0);
  const [boost, setBoost] = useState<string>(match.myPrediction?.boost ?? "none");
  const [koWinner, setKoWinner] = useState<number | null>(match.myPrediction?.koWinnerTeamId ?? null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

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
      toast("⚠️", "Choisis l'équipe qui se qualifie en cas de nul !");
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
      toast("✓", "Prono enregistré");
      mutate("/api/matches");
      mutate("/api/auth/me");
    } catch (err) {
      toast("✕", err instanceof Error ? err.message : "Erreur");
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

  return (
    <div className={`surface rounded-2xl overflow-hidden ${live ? "ring-1 ring-tomato/40" : ""}`}>
      <div className="p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-bone-faint">
            {match.groupName ? `Groupe ${match.groupName}` : match.isKnockout ? "Élimination" : ""}
          </span>
          <StatusPill match={match} />
        </div>

        {/* Affiche */}
        <div className="flex items-center justify-between gap-2">
          <TeamSide team={match.home} align="left" />

          <div className="flex flex-col items-center shrink-0 px-1.5">
            {finished || live ? (
              <div className="flex items-center gap-2 display text-4xl font-extrabold leading-none">
                <AnimatedNumber value={match.homeScore ?? 0} className={scoreColor(match, "home")} />
                <span className="text-bone-faint/40 text-2xl">:</span>
                <AnimatedNumber value={match.awayScore ?? 0} className={scoreColor(match, "away")} />
              </div>
            ) : (
              <span className="display text-bone-faint/40 text-lg font-bold">VS</span>
            )}
          </div>

          <TeamSide team={match.away} align="right" />
        </div>

        {/* Pronostic */}
        {!match.locked ? (
          <div className="mt-4 pt-4 border-t border-line">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-400 mb-3 text-center">
              Ton pronostic
            </div>
            <div className="flex items-center justify-center gap-4">
              <Stepper value={home} onChange={(d) => changeScore("home", d)} />
              <span className="display text-2xl font-bold text-bone-faint/30 mt-1">:</span>
              <Stepper value={away} onChange={(d) => changeScore("away", d)} />
            </div>

            {needsKoWinner && (
              <div className="mt-3">
                <div className="text-center text-[11px] text-amber font-semibold mb-2">
                  Nul prédit → qui se qualifie ?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[match.home, match.away].map((t) =>
                    t ? (
                      <button
                        key={t.id}
                        onClick={() => { setKoWinner(t.id); setDirty(true); }}
                        className={`py-2 rounded-lg text-sm font-bold transition-all ${
                          koWinner === t.id
                            ? "bg-amber/20 ring-1 ring-amber text-amber"
                            : "bg-ink-900 text-bone-dim"
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
                const stock = b === "double" ? me?.doublesLeft ?? 0 : b === "banco" ? me?.bancosLeft ?? 0 : 99;
                const owned = boost === b;
                const usable = b === "none" || owned || stock > 0;
                return (
                  <button
                    key={b}
                    disabled={!usable}
                    onClick={() => { setBoost(b); setDirty(true); }}
                    className={`relative py-2 rounded-lg overflow-hidden text-xs font-bold transition-all ${
                      owned && b === "banco"
                        ? "foil"
                        : owned && b === "double"
                          ? "bg-lime-400 text-onaccent"
                          : owned
                            ? "bg-bone/15 text-bone ring-1 ring-line"
                            : usable
                              ? "bg-ink-900 text-bone-dim hover:bg-ink-750"
                              : "bg-ink-900/50 text-bone-faint/40 cursor-not-allowed"
                    }`}
                  >
                    <div className="display">{def.label}</div>
                    {b !== "none" && (
                      <div className={`text-[9px] font-semibold ${owned ? "opacity-80" : "opacity-60"}`}>
                        ×{def.mult} · {b === "double" ? me?.doublesLeft ?? 0 : me?.bancosLeft ?? 0} restant
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={save}
              disabled={saving}
              className={`display w-full mt-4 py-3 rounded-xl font-extrabold text-sm tracking-tight transition-all active:scale-[0.98] ${
                dirty
                  ? "bg-lime-400 text-onaccent hover:bg-lime-300"
                  : "bg-ink-900 text-bone-dim"
              }`}
            >
              {saving ? "..." : dirty ? "Valider mon prono" : pred ? "Prono enregistré ✓" : "Valider"}
            </button>
            <Deadline iso={match.kickoff} />
          </div>
        ) : (
          <LockedPrediction match={match} earned={earned} />
        )}
      </div>
    </div>
  );
}

function StatusPill({ match }: { match: MatchView }) {
  if (isLive(match.status)) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-tomato">
        <span className="w-1.5 h-1.5 rounded-full bg-tomato live-dot" />
        {match.minute ?? "Direct"}
      </span>
    );
  }
  if (match.status === "FINISHED") {
    return <span className="text-[11px] font-bold uppercase tracking-wide text-bone-faint">Terminé</span>;
  }
  return <span className="text-[11px] font-semibold text-bone-dim">{formatKickoff(match.kickoff)}</span>;
}

function TeamSide({ team, align }: { team: MatchView["home"]; align: "left" | "right" }) {
  return (
    <div className={`flex-1 flex items-center gap-2.5 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <TeamBadge team={team} size="lg" />
      <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
        <div className="font-bold text-sm text-bone truncate leading-tight">{team?.name ?? "À venir"}</div>
        <div className="text-[10px] text-bone-faint font-bold tracking-wide">{team?.tla}</div>
      </div>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => onChange(1)}
        className="w-14 h-7 rounded-lg bg-ink-900 text-bone-dim font-bold text-base active:scale-90 hover:bg-ink-750 hover:text-lime-400 transition-all flex items-center justify-center"
        aria-label="+1"
      >
        ▲
      </button>
      <div className="display w-16 h-16 rounded-xl bg-ink-900 border border-line flex items-center justify-center text-4xl font-extrabold num">
        {value}
      </div>
      <button
        onClick={() => onChange(-1)}
        className="w-14 h-7 rounded-lg bg-ink-900 text-bone-dim font-bold text-base active:scale-90 hover:bg-ink-750 hover:text-lime-400 transition-all flex items-center justify-center"
        aria-label="-1"
      >
        ▼
      </button>
    </div>
  );
}

function Deadline({ iso }: { iso: string }) {
  const cd = countdown(iso);
  if (!cd) return null;
  return (
    <p className="text-center text-[10px] text-bone-faint mt-2.5 uppercase tracking-wide">
      Verrouillage au coup d&apos;envoi · {cd}
    </p>
  );
}

function LockedPrediction({ match, earned }: { match: MatchView; earned: number | null | undefined }) {
  const pred = match.myPrediction;

  if (!pred) {
    return (
      <div className="mt-4 pt-4 border-t border-line text-center">
        <p className="text-sm text-bone-faint">Pas de prono sur ce match 😴</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-bone-faint font-bold uppercase tracking-wide">Ton prono</span>
          <span className="display text-sm font-extrabold bg-ink-900 px-2.5 py-1 rounded-md num">
            {pred.homeScore}:{pred.awayScore}
          </span>
          {pred.boost !== "none" && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pred.boost === "banco" ? "foil" : "bg-lime-400/20 text-lime-400"}`}>
              ×{pred.boost === "banco" ? 3 : 2}
            </span>
          )}
        </div>
        {match.settled && earned != null && (
          <span
            className={`display text-base font-extrabold px-2.5 py-0.5 rounded-md ${
              earned > 0 ? "bg-lime-400/15 text-lime-400" : "bg-tomato/15 text-tomato"
            }`}
          >
            {earned > 0 ? "+" : ""}<AnimatedNumber value={earned} /> pts
          </span>
        )}
      </div>
      {match.settled && pred.breakdown && (
        <p className="text-[11px] text-bone-faint mt-2">{describeBreakdown(pred.breakdown)}</p>
      )}
      {!match.settled && (
        <p className="text-[11px] text-bone-faint mt-2">En attente du résultat…</p>
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
  if (match.status !== "FINISHED") return "text-bone";
  const h = match.homeScore ?? 0;
  const a = match.awayScore ?? 0;
  const won = side === "home" ? h > a : a > h;
  return won ? "text-lime-400" : "text-bone-dim";
}
