"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, post } from "@/lib/client/api";
import type { MatchView, BonusQuestion } from "@/lib/client/types";
import { useToast } from "./Toasts";
import { stageLabel, formatKickoff } from "@/lib/client/format";

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const { data: status } = useSWR<{ mode: string }>("/api/status", fetcher);
  const [tab, setTab] = useState<"scores" | "bonus">("scores");

  return (
    <div className="pt-1 animate-rise">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg surface flex items-center justify-center active:scale-90 text-bone-dim"
        >
          ←
        </button>
        <h1 className="display text-xl font-extrabold">Administration</h1>
      </div>

      <ModeBanner mode={status?.mode} />

      <div className="flex gap-2 my-4">
        {(["scores", "bonus"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`display flex-1 py-2 rounded-lg font-bold text-sm tracking-tight ${
              tab === t ? "bg-lime-400 text-onaccent" : "surface text-bone-dim"
            }`}
          >
            {t === "scores" ? "Scores" : "Bonus"}
          </button>
        ))}
      </div>

      {tab === "scores" ? <ScoreAdmin mode={status?.mode} /> : <BonusAdmin />}
    </div>
  );
}

function ModeBanner({ mode }: { mode?: string }) {
  const cfg = {
    demo: { e: "🎮", t: "Mode démo", d: "Matchs simulés en accéléré. Tout est automatique." },
    api: { e: "🛰️", t: "Mode API football-data", d: "Scores récupérés et validés automatiquement en temps réel." },
    manual: { e: "✍️", t: "Mode manuel", d: "Saisis les scores ci-dessous, la distribution des points est automatique." },
  }[mode ?? "manual"] ?? { e: "✍️", t: "Mode manuel", d: "" };

  return (
    <div className="surface rounded-xl p-4 flex items-start gap-3">
      <span className="text-2xl">{cfg.e}</span>
      <div>
        <div className="display font-bold text-sm">{cfg.t}</div>
        <div className="text-xs text-bone-faint">{cfg.d}</div>
      </div>
    </div>
  );
}

function ScoreAdmin({ mode }: { mode?: string }) {
  const { data: matches } = useSWR<MatchView[]>("/api/matches", fetcher, { refreshInterval: 20_000 });
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);

  async function resync() {
    setSyncing(true);
    try {
      const r = await post<{ fixtures: { matches: number } }>("/api/admin/sync", {});
      toast("🛰️", `Synchronisé : ${r.fixtures.matches} matchs.`);
      mutate("/api/matches");
    } catch (err) {
      toast("✕", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  }

  const editable = (matches ?? []).filter((m) => m.home && m.away);

  return (
    <div className="space-y-2.5">
      {mode === "api" && (
        <button
          onClick={resync}
          disabled={syncing}
          className="display w-full surface rounded-xl py-3 font-bold text-lime-400 active:scale-[0.98] disabled:opacity-50"
        >
          {syncing ? "Synchronisation…" : "🔄 Resynchroniser le calendrier"}
        </button>
      )}
      {mode === "manual" && (
        <p className="text-xs text-bone-faint px-1 pb-1">
          Renseigne le score final puis valide : les points de tout le monde sont calculés instantanément.
        </p>
      )}
      {editable.map((m) => (
        <AdminMatchRow key={m.id} match={m} />
      ))}
    </div>
  );
}

function AdminMatchRow({ match }: { match: MatchView }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [home, setHome] = useState(match.homeScore ?? 0);
  const [away, setAway] = useState(match.awayScore ?? 0);
  const [winner, setWinner] = useState<"HOME_TEAM" | "AWAY_TEAM" | null>(
    match.winner === "HOME_TEAM" || match.winner === "AWAY_TEAM" ? match.winner : null,
  );
  const [saving, setSaving] = useState(false);

  const needsWinner = match.isKnockout && home === away;

  async function submit(statusValue: "IN_PLAY" | "FINISHED") {
    if (needsWinner && !winner) {
      toast("⚠️", "Nul en phase finale : choisis le qualifié.");
      return;
    }
    setSaving(true);
    try {
      await post("/api/admin/match", {
        matchId: match.id,
        homeScore: home,
        awayScore: away,
        winnerSide: needsWinner ? winner : null,
        status: statusValue,
      });
      toast("✓", statusValue === "FINISHED" ? "Match validé, points distribués" : "Score live mis à jour");
      mutate("/api/matches");
      mutate("/api/leaderboard");
    } catch (err) {
      toast("✕", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="surface rounded-xl p-3">
      <div className="flex items-center justify-between text-[10px] text-bone-faint uppercase tracking-wide mb-2">
        <span>{stageLabel(match.stage)}{match.groupName ? ` · Gr. ${match.groupName}` : ""}</span>
        <span>{match.status === "FINISHED" ? "✅ Terminé" : formatKickoff(match.kickoff)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="display flex-1 text-sm font-bold truncate text-right">{match.home?.tla}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <NumBox value={home} onChange={setHome} />
          <span className="text-bone-faint/40 font-bold">:</span>
          <NumBox value={away} onChange={setAway} />
        </div>
        <span className="display flex-1 text-sm font-bold truncate">{match.away?.tla}</span>
      </div>

      {needsWinner && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(["HOME_TEAM", "AWAY_TEAM"] as const).map((side) => (
            <button
              key={side}
              onClick={() => setWinner(side)}
              className={`py-1.5 rounded-lg text-xs font-bold ${
                winner === side ? "bg-amber/20 text-amber ring-1 ring-amber" : "bg-ink-900 text-bone-faint"
              }`}
            >
              {(side === "HOME_TEAM" ? match.home : match.away)?.tla} qualifié
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2.5">
        <button
          onClick={() => submit("IN_PLAY")}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-xs font-bold bg-ink-900 text-bone-dim active:scale-95 disabled:opacity-50"
        >
          🔴 En direct
        </button>
        <button
          onClick={() => submit("FINISHED")}
          disabled={saving}
          className="display flex-1 py-2 rounded-lg text-xs font-extrabold bg-lime-400 text-onaccent active:scale-95 disabled:opacity-50"
        >
          ✅ Valider le résultat
        </button>
      </div>
    </div>
  );
}

function NumBox({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      min={0}
      max={30}
      onChange={(e) => onChange(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
      className="display w-11 h-10 text-center bg-ink-900 border border-line rounded-lg font-extrabold text-lg num focus:outline-none focus:border-lime-400"
    />
  );
}

function BonusAdmin() {
  const { data: questions } = useSWR<BonusQuestion[]>("/api/bonus", fetcher);
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  async function settle(q: BonusQuestion) {
    const answer = answers[q.id]?.trim();
    if (!answer) return;
    setSaving(q.id);
    try {
      await post("/api/admin/bonus", { questionId: q.id, answer });
      toast("✓", `« ${q.label} » validée`);
      mutate("/api/bonus");
      mutate("/api/leaderboard");
    } catch (err) {
      toast("✕", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  const manual = (questions ?? []).filter((q) => !q.settled);

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-bone-faint px-1">
        « Champion » et « Finalistes » se valident automatiquement depuis les résultats. Valide ici les autres (ex : meilleur buteur).
      </p>
      {manual.length === 0 && (
        <div className="surface rounded-xl p-6 text-center text-bone-faint text-sm">
          Toutes les questions sont réglées ✅
        </div>
      )}
      {manual.map((q) => (
        <div key={q.id} className="surface rounded-xl p-4">
          <div className="display font-bold text-sm mb-1">{q.label}</div>
          <div className="text-xs text-bone-faint mb-3 num">{q.points} pts · réponse officielle</div>
          <div className="flex gap-2">
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Réponse gagnante…"
              className="flex-1 bg-ink-900 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
            />
            <button
              onClick={() => settle(q)}
              disabled={saving === q.id || !answers[q.id]?.trim()}
              className="display bg-lime-400 text-onaccent font-extrabold text-sm px-4 rounded-lg active:scale-95 disabled:opacity-30"
            >
              Valider
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
