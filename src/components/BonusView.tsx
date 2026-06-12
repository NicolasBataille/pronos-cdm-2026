"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, post } from "@/lib/client/api";
import type { BonusQuestion } from "@/lib/client/types";
import { useToast } from "./Toasts";
import { formatKickoff } from "@/lib/client/format";

export function BonusView() {
  const { data: questions, isLoading } = useSWR<BonusQuestion[]>("/api/bonus", fetcher);

  if (isLoading) return <Skeleton />;

  return (
    <div className="pt-2">
      <h1 className="text-2xl font-black text-center mb-1">
        <span className="shimmer-gold">Questions Bonus</span>
      </h1>
      <p className="text-center text-white/40 text-xs mb-6">
        Des gros points à grappiller avant le coup d&apos;envoi 🎁
      </p>

      <div className="space-y-4">
        {(questions ?? []).map((q) => (
          <BonusCard key={q.id} q={q} />
        ))}
      </div>
    </div>
  );
}

function BonusCard({ q }: { q: BonusQuestion }) {
  const { mutate } = useSWRConfig();
  const toast = useToast();
  const [answer, setAnswer] = useState(q.myAnswer ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!answer.trim()) return;
    setSaving(true);
    try {
      await post("/api/bonus", { questionId: q.id, answer: answer.trim() });
      toast("✅", "Réponse enregistrée !");
      mutate("/api/bonus");
    } catch (err) {
      toast("❌", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const isFinalists = q.kind === "finalists";

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-black text-base leading-tight">{q.label}</h3>
        <span className="shrink-0 bg-gold-500/20 text-gold-300 text-xs font-black px-2.5 py-1 rounded-full">
          {q.points} pts
        </span>
      </div>
      <p className="text-sm text-white/50 mb-4">{q.description}</p>

      {q.settled ? (
        <div className="space-y-2">
          <div className="bg-night-900/50 rounded-2xl px-4 py-3">
            <div className="text-[11px] text-white/40 uppercase font-bold">Réponse officielle</div>
            <div className="font-bold text-pitch-50">{q.answer?.replace("|", " & ")}</div>
          </div>
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-white/50">
              Ta réponse : <span className="text-white/80">{q.myAnswer ?? "—"}</span>
            </span>
            <span
              className={`font-black ${q.myPoints ? "text-pitch-500" : "text-magenta-400"}`}
            >
              +{q.myPoints ?? 0} pts
            </span>
          </div>
        </div>
      ) : q.locked ? (
        <div className="bg-night-900/50 rounded-2xl px-4 py-3 text-center">
          <span className="text-sm text-white/50">
            🔒 Réponses closes · Ta réponse : <span className="text-white/80 font-bold">{q.myAnswer ?? "—"}</span>
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={isFinalists ? "Équipe 1 | Équipe 2" : "Ta réponse..."}
            className="w-full bg-night-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-electric-400 focus:ring-2 focus:ring-electric-400/20 transition-all"
          />
          {isFinalists && (
            <p className="text-[11px] text-white/30 ml-1">
              Sépare les deux équipes par une barre verticale « | »
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30">
              ⏳ Jusqu&apos;au {formatKickoff(q.deadline)}
            </span>
            <button
              onClick={save}
              disabled={saving || !answer.trim() || answer.trim() === q.myAnswer}
              className="bg-gradient-to-r from-electric-500 to-electric-400 text-night-900 font-black text-sm px-5 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-40"
            >
              {saving ? "..." : q.myAnswer ? "Modifier" : "Valider"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 mt-10">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass rounded-3xl h-40 animate-pulse opacity-50" />
      ))}
    </div>
  );
}
