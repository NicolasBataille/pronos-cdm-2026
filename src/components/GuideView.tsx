"use client";

import {
  SCORING_RULES,
  BOOST_INFO,
  BONUS_INFO,
  GUIDE_BADGES,
  GOLDEN_RULES,
} from "@/lib/client/guide-content";

export function GuideView() {
  return (
    <div className="pt-1 animate-rise space-y-7">
      <header>
        <div className="flex items-center gap-2 text-lime-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">
          <span className="h-px w-5 bg-lime-400" />
          Comment jouer
        </div>
        <h1 className="display text-3xl font-extrabold tracking-tight">Le guide</h1>
        <p className="text-bone-faint text-sm mt-1.5">Tout ce qu&apos;il faut savoir pour rafler la mise.</p>
      </header>

      {/* Comment marquer */}
      <Section title="Marquer des points" hint="à chaque match">
        <div className="space-y-2">
          {SCORING_RULES.map((r) => (
            <div
              key={r.title}
              className={`flex items-start gap-3 surface rounded-xl px-3.5 py-3`}
            >
              <span className="text-2xl shrink-0">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="display font-bold text-sm">{r.title}</div>
                <div className="text-[12px] text-bone-faint leading-snug">{r.detail}</div>
              </div>
              <span className="display text-lime-400 font-extrabold num shrink-0">{r.points}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Boosts */}
      <Section title="Les boosts" hint="jetons limités">
        <div className="space-y-2">
          {BOOST_INFO.map((b) => (
            <div key={b.name} className="flex items-start gap-3 surface rounded-xl px-3.5 py-3">
              <span className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 ${b.foil ? "foil" : "bg-ink-900"}`}>
                {b.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="display font-bold text-sm">
                  {b.name} <span className="text-lime-400">{b.mult}</span>
                  <span className="text-bone-faint font-sans font-normal"> · {b.stock}</span>
                </div>
                <div className="text-[12px] text-bone-faint leading-snug mt-0.5">{b.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Bonus */}
      <Section title="Questions bonus" hint="avant le 1er match">
        <div className="space-y-2">
          {BONUS_INFO.map((b) => (
            <div key={b.title} className="flex items-start gap-3 surface rounded-xl px-3.5 py-3">
              <span className="text-2xl shrink-0">{b.emoji}</span>
              <div className="min-w-0">
                <div className="display font-bold text-sm">{b.title}</div>
                <div className="text-[12px] text-bone-faint leading-snug">{b.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Vignettes */}
      <Section title="Vignettes à débloquer" hint={`${GUIDE_BADGES.length} au total`}>
        <div className="grid grid-cols-2 gap-2">
          {GUIDE_BADGES.map((b) => (
            <div key={b.id} className="flex items-center gap-2.5 surface rounded-xl px-3 py-2.5">
              <span className="text-2xl shrink-0">{b.emoji}</span>
              <div className="min-w-0">
                <div className="display font-bold text-[13px] truncate">{b.label}</div>
                <div className="text-[10px] text-bone-faint leading-tight">{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Règles d'or */}
      <Section title="Les règles d'or">
        <div className="surface rounded-2xl divide-y divide-line">
          {GOLDEN_RULES.map((rule, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="display text-lime-400 font-extrabold num shrink-0">{i + 1}</span>
              <p className="text-[13px] text-bone-dim leading-snug">{rule}</p>
            </div>
          ))}
        </div>
      </Section>

      <p className="text-center text-bone-faint/60 text-xs pb-2">
        Des questions ? Tape sur l&apos;épaule de l&apos;orga 👑
      </p>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="display text-xs font-extrabold uppercase tracking-[0.18em] text-bone-dim">{title}</h2>
        <span className="flex-1 h-px bg-ink-750" />
        {hint && <span className="text-[10px] font-semibold text-bone-faint uppercase tracking-wide">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
