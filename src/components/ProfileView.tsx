"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, post } from "@/lib/client/api";
import type { Me, BadgeView, LeaderboardRow } from "@/lib/client/types";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { AdminPanel } from "./AdminPanel";
import { ThemePicker } from "./ThemePicker";

interface BadgesResponse {
  owned: BadgeView[];
  all: BadgeView[];
}

export function ProfileView({ me }: { me?: Me }) {
  const { data: badges } = useSWR<BadgesResponse>("/api/badges", fetcher);
  const { data: board } = useSWR<LeaderboardRow[]>("/api/leaderboard", fetcher);
  const [showAdmin, setShowAdmin] = useState(false);

  const myRow = board?.find((r) => r.userId === me?.id);
  const ownedIds = new Set((badges?.owned ?? []).map((b) => b.badgeId));

  async function logout() {
    await post("/api/auth/logout", {});
    window.location.reload();
  }

  if (showAdmin && me?.isAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="pt-1 animate-rise">
      {/* Carte profil façon licence joueur */}
      <div className="surface-raised rounded-2xl overflow-hidden">
        <div className="h-1 foil" />
        <div className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-ink-900 ring-1 ring-line flex items-center justify-center text-4xl shrink-0">
            {me?.avatar}
          </div>
          <div className="min-w-0">
            <h1 className="display text-2xl font-extrabold truncate leading-tight">{me?.displayName}</h1>
            <p className="text-bone-faint text-sm">@{me?.username}</p>
            {me?.isAdmin && (
              <span className="display inline-block mt-1.5 bg-lime-400/15 text-lime-400 text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide">
                👑 Capitaine
              </span>
            )}
          </div>
        </div>
        {myRow && (
          <div className="grid grid-cols-3 border-t border-line divide-x divide-line">
            <Stat label="Rang" value={`#${myRow.rank}`} />
            <Stat label="Points" value={myRow.total} highlight animate />
            <Stat label="Exacts" value={`🎯 ${myRow.exactCount}`} />
          </div>
        )}
      </div>

      {/* Jetons */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Token emoji="✌️" value={me?.doublesLeft ?? 0} label="Doublés ×2" />
        <Token emoji="💰" value={me?.bancosLeft ?? 0} label="Banco ×3" foil />
      </div>

      {/* Badges */}
      <div className="mt-7">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="display font-extrabold text-lg">Vignettes</h2>
          <span className="flex-1 h-px bg-ink-750" />
          <span className="text-sm text-bone-faint num">
            {ownedIds.size}/{badges?.all.length ?? 0}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {(badges?.all ?? []).map((b) => {
            const owned = ownedIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`surface rounded-xl p-3 flex items-center gap-3 transition-all ${
                  owned ? "" : "opacity-35 grayscale"
                } ${owned ? "ring-1 ring-lime-400/20" : ""}`}
              >
                <span className="text-3xl shrink-0">{owned ? b.emoji : "🔒"}</span>
                <div className="min-w-0">
                  <div className="display font-bold text-sm truncate">{b.label}</div>
                  <div className="text-[10px] text-bone-faint leading-tight">{b.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thème */}
      <div className="mt-7">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="display font-extrabold text-lg">Thème</h2>
          <span className="flex-1 h-px bg-ink-750" />
        </div>
        <ThemePicker />
      </div>

      <div className="mt-7 space-y-2">
        {me?.isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="display w-full surface rounded-xl py-3 font-bold text-lime-400 active:scale-[0.98] transition-transform hover:bg-ink-800"
          >
            ⚙️ Panneau d&apos;administration
          </button>
        )}
        <button
          onClick={logout}
          className="w-full surface rounded-xl py-3 font-semibold text-tomato active:scale-[0.98] transition-transform hover:bg-ink-800"
        >
          Se déconnecter
        </button>
      </div>

      <p className="text-center text-bone-faint/60 text-xs mt-6">Pronos CDM 2026 · fait entre potes</p>
    </div>
  );
}

function Stat({
  label, value, highlight, animate,
}: {
  label: string; value: string | number; highlight?: boolean; animate?: boolean;
}) {
  return (
    <div className="py-3.5 text-center">
      <div className={`display text-xl font-extrabold ${highlight ? "text-lime-400" : "text-bone"}`}>
        {animate && typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      <div className="text-[10px] text-bone-faint mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Token({ emoji, value, label, foil }: { emoji: string; value: number; label: string; foil?: boolean }) {
  return (
    <div className="surface rounded-xl p-4 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 ${foil ? "foil" : "bg-ink-900"}`}>
        {emoji}
      </span>
      <div>
        <div className="display text-xl font-extrabold num">{value}</div>
        <div className="text-[11px] text-bone-faint">{label}</div>
      </div>
    </div>
  );
}
