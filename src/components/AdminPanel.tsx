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
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full glass flex items-center justify-center active:scale-90"
        >
          ←
        </button>
        <h1 className="text-xl font-black">⚙️ Administration</h1>
      </div>

      <ModeBanner mode={status?.mode} />

      <div className="flex gap-2 my-4">
        <button
          onClick={() => setTab("scores")}
          className={`flex-1 py-2 rounded-2xl font-bold text-sm ${
            tab === "scores" ? "bg-electric-500 text-night-900" : "glass text-white/60"
          }`}
        >
          Scores
        </button>
        <button
          onClick={() => setTab("bonus")}
          className={`flex-1 py-2 rounded-2xl font-bold text-sm ${
            tab === "bonus" ? "bg-electric-500 text-night-900" : "glass text-white/60"
          }`}
        >
          Bonus
        </button>
      </div>

      {tab === "scores" ? <ScoreAdmin mode={status?.mode} /> : <BonusAdmin />}
    </div>
  );
}

function ModeBanner({ mode }: { mode?: string }) {
  const cfg = {
    demo: { e: "🎮", t: "Mode démo", d: "Matchs simulés en accéléré. Tout est automatique." },
    api: { e: "🛰️", t: "Mode API football-data", d: "Scores récupérés et validés automatiquement en temps réel." },
    manual: { e: "✍️", t: "Mode manuel", d: "Saisis les scores ci-dessous, la validation des points est automatique." },
  }[mode ?? "manual"] ?? { e: "✍️", t: "Mode manuel", d: "" };

  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <span className="text-2xl">{cfg.e}</span>
      <div>
        <div className="font-bold text-sm">{cfg.t}</div>
        <div className="text-xs text-white/50">{cfg.d}</div>
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
      toast("❌", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  }

  const editable = (matches ?? []).filter((m) => m.home && m.away);

  return (
    <div className="space-y-3">
      {mode === "api" && (
        <button
          onClick={resync}
          disabled={syncing}
          className="w-full glass rounded-2xl py-3 font-bold text-electric-300 active:scale-95 disabled:opacity-50"
        >
          {syncing ? "Synchronisation..." : "🔄 Resynchroniser le calendrier"}
        </button>
      )}
      {mode === "manual" && (
        <p className="text-xs text-white/40 px-1">
          Renseigne le score final d&apos;un match puis valide : les points de tout le monde
          sont calculés instantanément.
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
      toast("✅", statusValue === "FINISHED" ? "Match validé, points distribués !" : "Score live mis à jour.");
      mutate("/api/matches");
      mutate("/api/leaderboard");
    } catch (err) {
      toast("❌", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center justify-between text-[11px] text-white/40 mb-2">
        <span>{stageLabel(match.stage)}{match.groupName ? ` · Gr. ${match.groupName}` : ""}</span>
        <span>
          {match.status === "FINISHED" ? "✅ Terminé" : formatKickoff(match.kickoff)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-sm font-bold truncate text-right">{match.home?.tla}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <NumBox value={home} onChange={setHome} />
          <span className="text-white/30 font-black">-</span>
          <NumBox value={away} onChange={setAway} />
        </div>
        <span className="flex-1 text-sm font-bold truncate">{match.away?.tla}</span>
      </div>

      {needsWinner && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setWinner("HOME_TEAM")}
            className={`py-1.5 rounded-lg text-xs font-bold ${
              winner === "HOME_TEAM" ? "bg-gold-500/30 text-gold-200" : "bg-night-900/40 text-white/50"
            }`}
          >
            {match.home?.tla} qualifié
          </button>
          <button
            onClick={() => setWinner("AWAY_TEAM")}
            className={`py-1.5 rounded-lg text-xs font-bold ${
              winner === "AWAY_TEAM" ? "bg-gold-500/30 text-gold-200" : "bg-night-900/40 text-white/50"
            }`}
          >
            {match.away?.tla} qualifié
          </button>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => submit("IN_PLAY")}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-xs font-bold bg-night-900/40 text-white/60 active:scale-95 disabled:opacity-50"
        >
          🔴 En direct
        </button>
        <button
          onClick={() => submit("FINISHED")}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-pitch-500 to-pitch-600 text-white active:scale-95 disabled:opacity-50"
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
      className="w-12 h-10 text-center bg-night-900/60 border border-white/10 rounded-xl font-black text-lg focus:outline-none focus:border-electric-400"
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
      toast("✅", `« ${q.label} » validée.`);
      mutate("/api/bonus");
      mutate("/api/leaderboard");
    } catch (err) {
      toast("❌", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }

  const manual = (questions ?? []).filter((q) => !q.settled);

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40 px-1">
        Les questions « Champion » et « Finalistes » se valident toutes seules à partir des résultats.
        Valide ici les autres (ex : meilleur buteur).
      </p>
      {manual.length === 0 && (
        <div className="glass rounded-2xl p-6 text-center text-white/40 text-sm">
          Toutes les questions sont réglées ✅
        </div>
      )}
      {manual.map((q) => (
        <div key={q.id} className="glass rounded-2xl p-4">
          <div className="font-bold text-sm mb-1">{q.label}</div>
          <div className="text-xs text-white/40 mb-3">{q.points} pts · réponse officielle</div>
          <div className="flex gap-2">
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Réponse gagnante..."
              className="flex-1 bg-night-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-electric-400"
            />
            <button
              onClick={() => settle(q)}
              disabled={saving === q.id || !answers[q.id]?.trim()}
              className="bg-gold-500 text-night-900 font-black text-sm px-4 rounded-xl active:scale-95 disabled:opacity-40"
            >
              Valider
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
