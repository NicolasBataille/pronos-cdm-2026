"use client";

import { useState } from "react";
import { post } from "@/lib/client/api";

const AVATARS = ["⚽", "🦁", "🐉", "🦅", "🐯", "🦊", "🐺", "🦈", "🚀", "👑", "🔥", "⚡", "🎯", "💎", "🐐", "🤖"];

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [avatar, setAvatar] = useState("⚽");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await post("/api/auth/register", { username, displayName, password, inviteCode, avatar });
      } else {
        await post("/api/auth/login", { username, password });
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm animate-[slide-up_0.5s_ease-out]">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3 drop-shadow-[0_0_25px_rgba(251,191,36,0.4)]">🏆</div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="shimmer-gold">Pronos CDM</span>
          </h1>
          <p className="text-electric-400 font-bold text-lg tracking-widest mt-1">2026</p>
          <p className="text-white/50 text-sm mt-3">
            Le championnat de pronostics entre potes ⚽
          </p>
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          <div className="flex gap-1 p-1 mb-6 bg-night-900/50 rounded-2xl">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mode === "login" ? "bg-electric-500 text-night-900 shadow-lg" : "text-white/60"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mode === "register" ? "bg-electric-500 text-night-900 shadow-lg" : "text-white/60"
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wide ml-1">
                  Ton avatar
                </label>
                <div className="grid grid-cols-8 gap-1.5 mt-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                        avatar === a
                          ? "bg-electric-500/30 ring-2 ring-electric-400 scale-110"
                          : "bg-night-900/40 hover:bg-night-700"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field
              label="Pseudo"
              value={username}
              onChange={setUsername}
              placeholder="ton_pseudo"
              autoFocus
            />
            {mode === "register" && (
              <Field
                label="Nom affiché (optionnel)"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Comment on t'appelle"
              />
            )}
            <Field
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••"
            />
            {mode === "register" && (
              <Field
                label="Code d'invitation"
                value={inviteCode}
                onChange={setInviteCode}
                placeholder="Demande-le à l'orga 🤫"
              />
            )}

            {error && (
              <div className="bg-magenta-500/15 border border-magenta-500/30 text-magenta-200 text-sm rounded-xl px-4 py-2.5 animate-[pop_0.2s]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-400 text-night-900 font-black text-base py-3.5 rounded-2xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60 disabled:scale-100"
            >
              {loading ? "..." : mode === "login" ? "C'est parti ! ⚽" : "Rejoindre la partie 🚀"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Le premier inscrit devient l&apos;administrateur 👑
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wide ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full mt-1.5 bg-night-900/50 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-electric-400 focus:ring-2 focus:ring-electric-400/20 transition-all"
      />
    </div>
  );
}
