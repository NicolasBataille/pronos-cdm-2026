"use client";

import { useLive } from "@/lib/client/useLive";
import { useToast } from "./Toasts";

// Relie le flux SSE aux toasts : affiche une notif pour les événements marquants.
export function LiveBridge() {
  const toast = useToast();

  useLive((event) => {
    if (event.type === "feed" || event.type === "badge") {
      const p = event.payload as { emoji?: string; message?: string } | undefined;
      if (p?.message) toast(p.emoji ?? "📣", p.message);
    }
  });

  return null;
}
