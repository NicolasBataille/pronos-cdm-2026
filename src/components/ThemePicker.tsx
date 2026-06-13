"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, visibleThemes, THEME_EVENT, type ThemeDef } from "@/lib/client/themes";

export function ThemePicker() {
  const [active, setActive] = useState<string>("ardoise");
  const [themes, setThemes] = useState<ThemeDef[]>([]);

  useEffect(() => {
    const refresh = () => {
      setActive(getStoredTheme());
      setThemes(visibleThemes());
    };
    refresh();
    // Se met à jour si le thème caché est débloqué pendant qu'on est sur cette page
    window.addEventListener(THEME_EVENT, refresh);
    return () => window.removeEventListener(THEME_EVENT, refresh);
  }, []);

  function choose(id: string) {
    applyTheme(id);
    setActive(id);
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {themes.map((t) => {
        const selected = active === t.id;
        const secret = t.id === "tigre";
        return (
          <button
            key={t.id}
            onClick={() => choose(t.id)}
            className={`surface rounded-xl p-2.5 text-left transition-all active:scale-[0.97] ${
              selected ? "ring-2 ring-lime-400" : "hover:bg-ink-800"
            }`}
          >
            <div
              className="relative h-12 rounded-lg mb-2 flex items-end gap-1 p-1.5 overflow-hidden"
              style={{ background: t.swatch[0] }}
            >
              <span className="flex-1 h-full rounded" style={{ background: t.swatch[1] }} />
              <span className="w-3 h-full rounded" style={{ background: t.swatch[2] }} />
              {secret && <span className="absolute top-1 left-1.5 text-xs">🐯</span>}
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold truncate">{t.label}</span>
              {selected && <span className="text-lime-400 text-xs shrink-0">✓</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
