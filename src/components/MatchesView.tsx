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
      <div className="text-center py-20 px-6">
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-xl font-black mb-2">Le tournoi arrive !</h2>
        <p className="text-white/50 text-sm">
          Les matchs apparaîtront ici dès que le calendrier sera synchronisé.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-[57px] z-20 -mx-4 px-4 py-2 backdrop-blur-md bg-night-900/60">
        <div className="flex gap-2">
          <FilterTab id="todo" current={filter} onClick={setFilter} label="À jouer" count={counts.todo} />
          <FilterTab id="live" current={filter} onClick={setFilter} label="En direct" count={counts.live} live />
          <FilterTab id="done" current={filter} onClick={setFilter} label="Terminés" count={counts.done} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyFilter filter={filter} />
      ) : (
        <div className="space-y-6 mt-3">
          {grouped.map(([stage, items]) => (
            <section key={stage}>
              <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-2 ml-1">
                {stageLabel(stage)}
              </h2>
              <div className="space-y-3">
                {items.map((m) => (
                  <MatchCard key={m.id} match={m} me={me} />
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
  id,
  current,
  onClick,
  label,
  count,
  live,
}: {
  id: Filter;
  current: Filter;
  onClick: (f: Filter) => void;
  label: string;
  count: number;
  live?: boolean;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 py-2 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
        active ? "bg-electric-500 text-night-900 shadow-lg" : "glass text-white/60"
      }`}
    >
      {live && count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-magenta-500 animate-pulse" />}
      {label}
      {count > 0 && (
        <span className={`text-xs ${active ? "text-night-900/60" : "text-white/30"}`}>{count}</span>
      )}
    </button>
  );
}

function EmptyFilter({ filter }: { filter: Filter }) {
  const msg =
    filter === "todo"
      ? { e: "🎉", t: "Tout est pronostiqué !", s: "Reviens quand de nouveaux matchs s'ouvrent." }
      : filter === "live"
        ? { e: "📺", t: "Aucun match en direct", s: "Reviens à l'heure du coup d'envoi !" }
        : { e: "⏳", t: "Aucun match terminé", s: "Les résultats arrivent bientôt." };
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{msg.e}</div>
      <h3 className="font-black">{msg.t}</h3>
      <p className="text-white/40 text-sm mt-1">{msg.s}</p>
    </div>
  );
}

function groupByStage(matches: MatchView[]): [string, MatchView[]][] {
  const order = [
    "GROUP_STAGE",
    "LAST_32",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "THIRD_PLACE",
    "FINAL",
  ];
  const map = new Map<string, MatchView[]>();
  for (const m of matches) {
    if (!map.has(m.stage)) map.set(m.stage, []);
    map.get(m.stage)!.push(m);
  }
  return [...map.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 mt-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass rounded-3xl p-4 h-40 animate-pulse opacity-50" />
      ))}
    </div>
  );
}
