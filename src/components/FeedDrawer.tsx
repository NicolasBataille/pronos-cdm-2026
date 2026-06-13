"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/api";
import type { FeedItem } from "@/lib/client/types";

export function FeedDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: feed } = useSWR<FeedItem[]>(open ? "/api/feed" : null, fetcher, {
    refreshInterval: open ? 15_000 : 0,
  });

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 z-40 h-dvh w-[86%] max-w-sm bg-ink-900 border-l border-line transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-line pitch-stripe">
          <h2 className="display font-extrabold text-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 live-dot" /> Le fil
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg surface flex items-center justify-center text-bone-dim active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100dvh-3.5rem)] p-3 space-y-2">
          {!feed || feed.length === 0 ? (
            <div className="text-center py-20 text-bone-faint">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-sm">Rien pour l&apos;instant.</p>
              <p className="text-xs mt-1">L&apos;activité du groupe s&apos;affichera ici.</p>
            </div>
          ) : (
            feed.map((item, i) => (
              <div
                key={item.id}
                className="surface rounded-xl p-3 flex items-start gap-3 animate-rise"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <span className="text-xl shrink-0">{item.emoji ?? "📣"}</span>
                <div className="min-w-0">
                  <p className="text-sm text-bone/90 leading-snug">{item.message}</p>
                  <p className="text-[10px] text-bone-faint mt-1 uppercase tracking-wide">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}
