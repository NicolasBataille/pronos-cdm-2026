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
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-5 py-10 z-10">
      <div className="w-full max-w-sm animate-rise">
        {/* Wordmark éditorial */}
        <div className="mb-9">
          <div className="flex items-center gap-2 text-lime-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-2">
            <span className="h-px w-6 bg-lime-400" />
            Coupe du Monde · 2026
          </div>
          <h1 className="display text-[3.4rem] leading-[0.85] font-extrabold">
            PRONOS
            <span className="block text-lime-400">ENTRE POTES</span>
          </h1>
          <p className="text-bone-faint text-sm mt-3 max-w-[15rem]">
            Le championnat de pronostics où on se chambre toute la compétition.
          </p>
        </div>

        {/* Carte façon billet de match */}
        <div className="surface-raised rounded-2xl overflow-hidden">
          <div className="h-1 foil" />
          <div className="p-5">
            <div className="flex gap-6 border-b border-line mb-5">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`relative pb-3 text-sm font-bold transition-colors ${
                    mode === m ? "text-bone" : "text-bone-faint hover:text-bone-dim"
                  }`}
                >
                  {m === "login" ? "Connexion" : "Inscription"}
                  {mode === m && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-lime-400 animate-rise" />
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <Label>Ton avatar</Label>
                  <div className="grid grid-cols-8 gap-1.5 mt-2">
                    {AVATARS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAvatar(a)}
                        className={`aspect-square rounded-lg text-xl flex items-center justify-center transition-all ${
                          avatar === a
                            ? "bg-lime-400/15 ring-1 ring-lime-400 scale-105"
                            : "bg-ink-900 hover:bg-ink-750"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Field label="Pseudo" value={username} onChange={setUsername} placeholder="ton_pseudo" autoFocus />
              {mode === "register" && (
                <Field label="Nom affiché (optionnel)" value={displayName} onChange={setDisplayName} placeholder="Comment on t'appelle" />
              )}
              <Field label="Mot de passe" value={password} onChange={setPassword} type="password" placeholder="••••••" />
              {mode === "register" && (
                <Field label="Code d'invitation" value={inviteCode} onChange={setInviteCode} placeholder="Demande-le à l'orga" />
              )}

              {error && (
                <div className="border-l-2 border-tomato bg-tomato/10 text-[#f6b3a8] text-sm rounded-r-lg px-3 py-2.5 animate-pop">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="display w-full bg-lime-400 text-onaccent font-extrabold text-base py-3.5 rounded-xl tracking-tight hover:bg-lime-300 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? "..." : mode === "login" ? "Entrer sur le terrain" : "Rejoindre la partie"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-bone-faint text-xs mt-5 tracking-wide">
          Le premier inscrit prend le brassard de capitaine 👑
        </p>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold text-bone-faint uppercase tracking-[0.15em]">
      {children}
    </label>
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
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full mt-1.5 bg-ink-900 border border-line rounded-xl px-3.5 py-3 text-bone placeholder:text-bone-faint/60 focus:outline-none focus:border-lime-400 transition-colors"
      />
    </div>
  );
}
