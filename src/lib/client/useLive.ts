"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";

type LiveEvent = { type: string; payload?: unknown };

/**
 * Abonnement au flux SSE : revalide les données SWR concernées en temps réel
 * et déclenche un callback optionnel (pour animations / toasts).
 */
export function useLive(onEvent?: (e: LiveEvent) => void) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.onmessage = (msg) => {
      let event: LiveEvent;
      try {
        event = JSON.parse(msg.data);
      } catch {
        return;
      }

      switch (event.type) {
        case "match_update":
          mutate("/api/matches");
          break;
        case "match_settled":
          mutate("/api/matches");
          mutate("/api/leaderboard");
          mutate("/api/feed");
          break;
        case "leaderboard":
          mutate("/api/leaderboard");
          mutate("/api/matches");
          break;
        case "badge":
        case "feed":
          mutate("/api/feed");
          mutate("/api/leaderboard");
          break;
      }
      onEvent?.(event);
    };

    source.onerror = () => {
      // EventSource se reconnecte automatiquement
    };

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
