"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, post } from "@/lib/client/api";
import type { Me, BadgeView, LeaderboardRow } from "@/lib/client/types";
import { AdminPanel } from "./AdminPanel";

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
    <div className="pt-2">
      {/* Carte profil */}
      <div className="glass-strong rounded-3xl p-6 text-center">
        <div className="text-6xl mb-2">{me?.avatar}</div>
        <h1 className="text-2xl font-black">{me?.displayName}</h1>
        <p className="text-white/40 text-sm">@{me?.username}</p>
        {me?.isAdmin && (
          <span className="inline-block mt-2 bg-gold-500/20 text-gold-300 text-xs font-bold px-3 py-1 rounded-full">
            👑 Administrateur
          </span>
        )}

        {myRow && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat label="Classement" value={`#${myRow.rank}`} />
            <Stat label="Points" value={myRow.total} highlight />
            <Stat label="Scores exacts" value={`🎯 ${myRow.exactCount}`} />
          </div>
        )}
      </div>

      {/* Jetons de boost */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">✌️</span>
          <div>
            <div className="text-xl font-black">{me?.doublesLeft ?? 0}</div>
            <div className="text-[11px] text-white/50">Doublés restants</div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">💰</span>
          <div>
            <div className="text-xl font-black">{me?.bancosLeft ?? 0}</div>
            <div className="text-[11px] text-white/50">Bancos restants</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-lg">🏅 Mes badges</h2>
          <span className="text-sm text-white/40">
            {ownedIds.size}/{badges?.all.length ?? 0}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(badges?.all ?? []).map((b) => {
            const owned = ownedIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`glass rounded-2xl p-3 flex items-center gap-3 transition-all ${
                  owned ? "" : "opacity-40 grayscale"
                }`}
              >
                <span className="text-3xl shrink-0">{owned ? b.emoji : "🔒"}</span>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{b.label}</div>
                  <div className="text-[10px] text-white/50 leading-tight">{b.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-2">
        {me?.isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="w-full glass rounded-2xl py-3 font-bold text-gold-300 active:scale-95 transition-transform"
          >
            ⚙️ Panneau d&apos;administration
          </button>
        )}
        <button
          onClick={logout}
          className="w-full glass rounded-2xl py-3 font-bold text-magenta-300 active:scale-95 transition-transform"
        >
          Se déconnecter
        </button>
      </div>

      <p className="text-center text-white/20 text-xs mt-6">Pronos CDM 2026 · fait entre potes ⚽</p>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-night-900/40 rounded-2xl py-3">
      <div className={`text-xl font-black ${highlight ? "gold-text" : ""}`}>{value}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  );
}
