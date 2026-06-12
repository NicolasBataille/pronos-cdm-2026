"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/client/api";
import type { Me } from "@/lib/client/types";
import { ToastProvider } from "./Toasts";
import { LiveBridge } from "./LiveBridge";
import { MatchesView } from "./MatchesView";
import { Leaderboard } from "./Leaderboard";
import { BonusView } from "./BonusView";
import { ProfileView } from "./ProfileView";
import { FeedDrawer } from "./FeedDrawer";

type Tab = "matches" | "ranking" | "bonus" | "profile";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "matches", label: "Matchs", emoji: "⚽" },
  { id: "ranking", label: "Classement", emoji: "🏆" },
  { id: "bonus", label: "Bonus", emoji: "🎁" },
  { id: "profile", label: "Profil", emoji: "👤" },
];

export function AppShell() {
  const [tab, setTab] = useState<Tab>("matches");
  const [feedOpen, setFeedOpen] = useState(false);
  const { data: me } = useSWR<Me>("/api/auth/me", fetcher);

  return (
    <ToastProvider>
      <LiveBridge />
      <div className="min-h-dvh max-w-2xl mx-auto flex flex-col">
        <Header me={me} onOpenFeed={() => setFeedOpen(true)} />

        <main className="flex-1 px-4 pb-28 pt-2">
          {tab === "matches" && <MatchesView me={me} />}
          {tab === "ranking" && <Leaderboard me={me} />}
          {tab === "bonus" && <BonusView />}
          {tab === "profile" && <ProfileView me={me} />}
        </main>

        <FeedDrawer open={feedOpen} onClose={() => setFeedOpen(false)} />
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </ToastProvider>
  );
}

function Header({ me, onOpenFeed }: { me?: Me; onOpenFeed: () => void }) {
  return (
    <header className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between backdrop-blur-md bg-night-900/70 border-b border-white/5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏆</span>
        <div className="leading-none">
          <div className="font-black text-lg shimmer-gold">Pronos CDM</div>
          <div className="text-[10px] text-electric-400 font-bold tracking-widest">2026</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenFeed}
          className="relative w-10 h-10 rounded-full glass flex items-center justify-center text-lg active:scale-90 transition-transform"
          aria-label="Activité"
        >
          🔔
        </button>
        {me && (
          <div className="flex items-center gap-2 glass rounded-full pl-1 pr-3 py-1">
            <span className="w-8 h-8 rounded-full bg-night-700 flex items-center justify-center text-lg">
              {me.avatar}
            </span>
            <span className="text-sm font-bold text-white/90 max-w-20 truncate">
              {me.displayName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 max-w-2xl mx-auto">
      <div className="m-3 glass-strong rounded-3xl px-2 py-2 shadow-2xl flex items-center justify-around">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all ${
                active ? "bg-electric-500/20" : ""
              }`}
            >
              <span className={`text-xl transition-transform ${active ? "scale-110" : "opacity-50"}`}>
                {t.emoji}
              </span>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  active ? "text-electric-300" : "text-white/40"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
