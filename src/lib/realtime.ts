import { EventEmitter } from "node:events";

export interface LiveEvent {
  type:
    | "match_update"
    | "match_settled"
    | "badge"
    | "boost_used"
    | "feed"
    | "leaderboard";
  payload?: unknown;
}

// Bus d'événements partagé entre le poller et les connexions SSE.
// Singleton sur globalThis pour survivre au hot-reload en dev.
const globalForBus = globalThis as unknown as { __cdmBus?: EventEmitter };

export const bus = globalForBus.__cdmBus ?? (globalForBus.__cdmBus = new EventEmitter());
bus.setMaxListeners(200);

export function broadcast(event: LiveEvent) {
  bus.emit("live", event);
}
