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
    <div className="pt-1">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-lime-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">
          <span className="h-px w-5 bg-lime-400" />
          Gros points
        </div>
        <h1 className="display text-3xl font-extrabold tracking-tight">Questions bonus</h1>
        <p className="text-bone-faint text-sm mt-1.5">À répondre avant le coup d&apos;envoi du tournoi.</p>
      </header>

      <div className="space-y-3">
        {(questions ?? []).map((q, i) => (
          <div key={q.id} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <BonusCard q={q} />
          </div>
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
      toast("✓", "Réponse enregistrée");
      mutate("/api/bonus");
    } catch (err) {
      toast("✕", err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const isFinalists = q.kind === "finalists";

  return (
    <div className="surface rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="display font-extrabold text-base leading-tight">{q.label}</h3>
          <span className="display shrink-0 bg-lime-400/15 text-lime-400 text-xs font-extrabold px-2.5 py-1 rounded-md num">
            {q.points} pts
          </span>
        </div>
        <p className="text-sm text-bone-faint mb-4">{q.description}</p>

        {q.settled ? (
          <div className="space-y-2">
            <div className="bg-ink-900 rounded-xl px-4 py-3 border-l-2 border-lime-400">
              <div className="text-[10px] text-bone-faint uppercase font-bold tracking-wide">Réponse officielle</div>
              <div className="font-bold text-lime-400">{q.answer?.replace("|", " & ")}</div>
            </div>
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-bone-faint">
                Ta réponse : <span className="text-bone">{q.myAnswer ?? "—"}</span>
              </span>
              <span className={`display font-extrabold num ${q.myPoints ? "text-lime-400" : "text-tomato"}`}>
                +{q.myPoints ?? 0} pts
              </span>
            </div>
          </div>
        ) : q.locked ? (
          <div className="bg-ink-900 rounded-xl px-4 py-3 text-center">
            <span className="text-sm text-bone-faint">
              🔒 Réponses closes · <span className="text-bone font-bold">{q.myAnswer ?? "—"}</span>
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={isFinalists ? "Équipe 1 | Équipe 2" : "Ta réponse…"}
              className="w-full bg-ink-900 border border-line rounded-xl px-3.5 py-3 text-bone placeholder:text-bone-faint/60 focus:outline-none focus:border-lime-400 transition-colors"
            />
            {isFinalists && (
              <p className="text-[11px] text-bone-faint ml-1">Sépare les deux équipes par « | ».</p>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-bone-faint">Jusqu&apos;au {formatKickoff(q.deadline)}</span>
              <button
                onClick={save}
                disabled={saving || !answer.trim() || answer.trim() === q.myAnswer}
                className="display bg-lime-400 text-onaccent font-extrabold text-sm px-5 py-2 rounded-lg active:scale-95 transition-transform disabled:opacity-30 hover:bg-lime-300"
              >
                {saving ? "..." : q.myAnswer ? "Modifier" : "Valider"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 mt-10">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface rounded-2xl h-40 animate-pulse opacity-40" />
      ))}
    </div>
  );
}
