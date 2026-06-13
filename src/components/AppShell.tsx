"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/client/api";
import type { Me } from "@/lib/client/types";
import { ToastProvider } from "./Toasts";
import { LiveBridge } from "./LiveBridge";
import { SecretTheme } from "./SecretTheme";
import { MatchesView } from "./MatchesView";
import { Leaderboard } from "./Leaderboard";
import { BonusView } from "./BonusView";
import { ProfileView } from "./ProfileView";
import { GuideView } from "./GuideView";
import { FeedDrawer } from "./FeedDrawer";
import { Onboarding } from "./Onboarding";

type Tab = "matches" | "ranking" | "bonus" | "guide" | "profile";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "matches", label: "Matchs", emoji: "⚽" },
  { id: "ranking", label: "Rang", emoji: "🏆" },
  { id: "bonus", label: "Bonus", emoji: "🎁" },
  { id: "guide", label: "Guide", emoji: "📖" },
  { id: "profile", label: "Profil", emoji: "👤" },
];

export function AppShell() {
  const [tab, setTab] = useState<Tab>("matches");
  const [feedOpen, setFeedOpen] = useState(false);
  const { data: me } = useSWR<Me>("/api/auth/me", fetcher);

  // Onboarding affiché tant que le user ne l'a pas terminé (une seule fois)
  const showOnboarding = me != null && me.onboarded === false;

  return (
    <ToastProvider>
      <LiveBridge />
      <SecretTheme />
      <div className="relative z-10 min-h-dvh max-w-2xl mx-auto flex flex-col">
        <Header me={me} onOpenFeed={() => setFeedOpen(true)} />

        <main className="flex-1 px-4 pb-28 pt-3">
          {tab === "matches" && <MatchesView me={me} />}
          {tab === "ranking" && <Leaderboard me={me} />}
          {tab === "bonus" && <BonusView />}
          {tab === "guide" && <GuideView />}
          {tab === "profile" && <ProfileView me={me} />}
        </main>

        <FeedDrawer open={feedOpen} onClose={() => setFeedOpen(false)} />
        <BottomNav tab={tab} onChange={setTab} />
      </div>

      {showOnboarding && <Onboarding me={me} />}
    </ToastProvider>
  );
}

function Header({ me, onOpenFeed }: { me?: Me; onOpenFeed: () => void }) {
  return (
    <header className="sticky top-0 z-30 px-4 h-14 flex items-center justify-between bg-ink-950/85 backdrop-blur-md border-b border-line pitch-stripe">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-lime-400" />
        <span className="display font-extrabold text-lg tracking-tight">PRONOS</span>
        <span className="text-bone-faint text-[10px] font-bold tracking-[0.2em] mt-0.5">/26</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenFeed}
          className="w-9 h-9 rounded-lg surface flex items-center justify-center text-base active:scale-90 transition-transform"
          aria-label="Activité"
        >
          🔔
        </button>
        {me && (
          <div className="flex items-center gap-2 surface rounded-lg pl-1 pr-2.5 py-1">
            <span className="w-7 h-7 rounded-md bg-ink-750 flex items-center justify-center text-base">
              {me.avatar}
            </span>
            <span className="text-sm font-semibold text-bone max-w-20 truncate">{me.displayName}</span>
          </div>
        )}
      </div>
    </header>
  );
}

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 max-w-2xl mx-auto bg-ink-900/95 backdrop-blur-md border-t border-line">
      <div className="grid grid-cols-5 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="relative flex flex-col items-center gap-1 py-1.5"
            >
              {active && (
                <span className="absolute top-0 w-8 h-0.5 bg-lime-400 rounded-full animate-rise" />
              )}
              <span className={`text-xl transition-all ${active ? "scale-110" : "opacity-40 grayscale"}`}>
                {t.emoji}
              </span>
              <span
                className={`text-[10px] font-bold tracking-wide whitespace-nowrap transition-colors ${
                  active ? "text-lime-400" : "text-bone-faint"
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
