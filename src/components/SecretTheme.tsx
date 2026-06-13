"use client";

import { useEffect } from "react";
import { applyTheme, unlockTigre, isTigreUnlocked } from "@/lib/client/themes";
import { useToast } from "./Toasts";

const CODE = "tigre";

/**
 * Easter egg : taper « t i g r e » dans l'ordre débloque (et active) le thème Tigre.
 * Écoute globale des frappes ; séquence robuste aux fautes (fenêtre glissante).
 */
export function SecretTheme() {
  const toast = useToast();

  useEffect(() => {
    let seq = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k.length !== 1 || k < "a" || k > "z") return;
      seq = (seq + k).slice(-CODE.length);
      if (seq === CODE) {
        seq = "";
        const firstTime = !isTigreUnlocked();
        unlockTigre();
        applyTheme("tigre");
        toast("🐯", firstTime ? "Thème secret Tigre débloqué ! Grrr 🔥" : "Thème Tigre activé 🐯");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast]);

  return null;
}
