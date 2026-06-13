"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/client/api";
import type { MatchView, Me } from "@/lib/client/types";
import { MatchCard } from "./MatchCard";
import { stageLabel, isLive } from "@/lib/client/format";

type Filter = "todo" | "live" | "done";

export function MatchesView({ me }: { me?: Me }) {
  const { data: matches, isLoading } = useSWR<MatchView[]>("/api/matches", fetcher, {
    refreshInterval: 30_000,
  });
  const [filter, setFilter] = useState<Filter>("todo");

  const counts = useMemo(() => {
    const m = matches ?? [];
    return {
      todo: m.filter((x) => !x.locked).length,
      live: m.filter((x) => isLive(x.status)).length,
      done: m.filter((x) => x.status === "FINISHED").length,
    };
  }, [matches]);

  const filtered = useMemo(() => {
    const m = matches ?? [];
    if (filter === "todo") return m.filter((x) => !x.locked);
    if (filter === "live") return m.filter((x) => isLive(x.status));
    return m.filter((x) => x.status === "FINISHED").reverse();
  }, [matches, filter]);

  const grouped = useMemo(() => groupByStage(filtered), [filtered]);

  if (isLoading) return <Skeleton />;

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-24 px-6 animate-rise">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="display text-2xl font-extrabold mb-2">Le tournoi arrive</h2>
        <p className="text-bone-faint text-sm">
          Les matchs apparaîtront ici dès que le calendrier sera synchronisé.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2.5 bg-ink-950/85 backdrop-blur-md">
        <div className="flex gap-2">
          <FilterTab id="todo" current={filter} onClick={setFilter} label="À jouer" count={counts.todo} />
          <FilterTab id="live" current={filter} onClick={setFilter} label="En direct" count={counts.live} live />
          <FilterTab id="done" current={filter} onClick={setFilter} label="Terminés" count={counts.done} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyFilter filter={filter} />
      ) : (
        <div className="space-y-7 mt-3">
          {grouped.map(([stage, items], gi) => (
            <section key={stage}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="display text-xs font-extrabold uppercase tracking-[0.18em] text-bone-dim">
                  {stageLabel(stage)}
                </h2>
                <span className="flex-1 h-px bg-ink-750" />
                <span className="text-[10px] font-bold text-bone-faint num">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((m, i) => (
                  <div key={m.id} className="animate-rise" style={{ animationDelay: `${(gi * 3 + i) * 40}ms` }}>
                    <MatchCard match={m} me={me} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  id, current, onClick, label, count, live,
}: {
  id: Filter; current: Filter; onClick: (f: Filter) => void; label: string; count: number; live?: boolean;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
        active ? "bg-lime-400 text-onaccent" : "surface text-bone-dim hover:text-bone"
      }`}
    >
      {live && count > 0 && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-ink-950" : "bg-tomato live-dot"}`} />}
      <span className="display tracking-tight">{label}</span>
      {count > 0 && (
        <span className={`text-xs num ${active ? "text-onaccent/60" : "text-bone-faint"}`}>{count}</span>
      )}
    </button>
  );
}

function EmptyFilter({ filter }: { filter: Filter }) {
  const msg =
    filter === "todo"
      ? { e: "✅", t: "Tout est pronostiqué", s: "Reviens quand de nouveaux matchs s'ouvrent." }
      : filter === "live"
        ? { e: "📺", t: "Aucun match en direct", s: "Reviens à l'heure du coup d'envoi." }
        : { e: "⏳", t: "Aucun match terminé", s: "Les résultats arrivent bientôt." };
  return (
    <div className="text-center py-20 animate-rise">
      <div className="text-4xl mb-3">{msg.e}</div>
      <h3 className="display font-extrabold text-lg">{msg.t}</h3>
      <p className="text-bone-faint text-sm mt-1">{msg.s}</p>
    </div>
  );
}

function groupByStage(matches: MatchView[]): [string, MatchView[]][] {
  const order = ["GROUP_STAGE", "LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];
  const map = new Map<string, MatchView[]>();
  for (const m of matches) {
    if (!map.has(m.stage)) map.set(m.stage, []);
    map.get(m.stage)!.push(m);
  }
  return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
}

function Skeleton() {
  return (
    <div className="space-y-3 mt-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface rounded-2xl h-44 animate-pulse opacity-40" />
      ))}
    </div>
  );
}
