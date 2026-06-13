"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { post } from "@/lib/client/api";
import type { Me } from "@/lib/client/types";
import { SCORING_RULES, BOOST_INFO } from "@/lib/client/guide-content";

interface Step {
  kicker: string;
  title: string;
  body?: string;
  render?: () => React.ReactNode;
  emoji: string;
}

export function Onboarding({ me }: { me?: Me }) {
  const { mutate } = useSWRConfig();
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const steps: Step[] = [
    {
      emoji: "👋",
      kicker: "Bienvenue",
      title: me ? `Salut ${me.displayName} !` : "Salut !",
      body: "Ici on pronostique tous les matchs de la Coupe du Monde, et on se chambre pendant un mois. Voici les règles en 30 secondes.",
    },
    {
      emoji: "🎯",
      kicker: "Le principe",
      title: "Prédis les scores",
      body: "Avant chaque coup d'envoi, donne ton score. Plus tu es précis, plus tu marques.",
      render: () => (
        <div className="space-y-2 mt-4 text-left">
          {SCORING_RULES.slice(0, 3).map((r) => (
            <div key={r.title} className="flex items-center gap-3 surface rounded-xl px-3 py-2.5">
              <span className="text-xl">{r.emoji}</span>
              <span className="flex-1 text-sm font-semibold text-bone">{r.title}</span>
              <span className="display text-lime-400 font-extrabold num">{r.points}</span>
            </div>
          ))}
          <p className="text-[11px] text-bone-faint text-center pt-1">
            …plus des bonus outsider 🦄 et série 🔥. Tout est dans l&apos;onglet Guide.
          </p>
        </div>
      ),
    },
    {
      emoji: "🚀",
      kicker: "Les boosts",
      title: "Multiplie tes points",
      body: "Pose un boost sur le match dont tu es sûr. Mais attention au stock !",
      render: () => (
        <div className="space-y-2 mt-4 text-left">
          {BOOST_INFO.map((b) => (
            <div key={b.name} className="flex items-center gap-3 surface rounded-xl px-3 py-2.5">
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${b.foil ? "foil" : "bg-ink-900"}`}>
                {b.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="display font-bold text-sm">
                  {b.name} <span className="text-lime-400">{b.mult}</span>
                </div>
                <div className="text-[11px] text-bone-faint">{b.stock}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      emoji: "🏅",
      kicker: "Pour le fun",
      title: "Bonus & vignettes",
      body: "Réponds aux questions bonus (champion, finalistes…) pour de gros points, et débloque des vignettes à collectionner — y compris quelques badges de la honte 🤡.",
    },
    {
      emoji: "⚽",
      kicker: "Prêt ?",
      title: "À toi de jouer",
      body: "Le classement se met à jour en direct dès la fin des matchs. Bonne chance — et que le meilleur gagne !",
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  async function finish() {
    setClosing(true);
    try {
      await post("/api/auth/onboarded", {});
    } catch {
      /* on ferme quand même */
    }
    mutate("/api/auth/me");
  }

  return (
    <div
      className={`fixed inset-0 z-[60] bg-ink-950 flex flex-col transition-opacity duration-300 ${
        closing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Barre de progression + skip */}
      <div className="flex items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors ${
              i <= step ? "bg-lime-400" : "bg-ink-750"
            }`}
          />
        ))}
        <button
          onClick={finish}
          className="text-bone-faint text-xs font-semibold ml-2 shrink-0 hover:text-bone"
        >
          Passer
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center overflow-y-auto">
        <div key={step} className="w-full max-w-sm" style={{ animation: "fade-in 0.4s ease-out both" }}>
          <div className="text-7xl mb-5">{current.emoji}</div>
          <div className="text-lime-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-2">
            {current.kicker}
          </div>
          <h2 className="display text-3xl font-extrabold leading-tight mb-3">{current.title}</h2>
          {current.body && <p className="text-bone-dim text-[15px] leading-relaxed">{current.body}</p>}
          {current.render?.()}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="display w-full bg-lime-400 text-onaccent font-extrabold text-base py-3.5 rounded-xl tracking-tight hover:bg-lime-300 active:scale-[0.98] transition-all"
        >
          {isLast ? "C'est parti !" : "Suivant"}
        </button>
        {step > 0 && !isLast && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="w-full text-bone-faint text-sm font-semibold mt-3 hover:text-bone-dim"
          >
            Retour
          </button>
        )}
      </div>
    </div>
  );
}
