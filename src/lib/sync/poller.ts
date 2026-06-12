import { syncLive, isApiConfigured } from "./football-data";
import { tickDemo, isDemoMode } from "./demo";
import { settleFinishedMatches } from "@/lib/game/settle";
import { snapshotStandings } from "@/lib/game/leaderboard";

const globalForPoller = globalThis as unknown as {
  __cdmPoller?: { live?: NodeJS.Timeout; daily?: NodeJS.Timeout; started?: boolean };
};

const state = (globalForPoller.__cdmPoller ??= {});

// Intervalle de poll : court quand un match est en cours, sinon plus lent.
const FAST_MS = 60_000; // 1 min pendant les matchs
const SLOW_MS = 10 * 60_000; // 10 min sinon
const DEMO_MS = 5_000; // 5 s en démo

let currentDelay = SLOW_MS;

async function tick(): Promise<void> {
  try {
    if (isDemoMode()) {
      tickDemo();
      settleFinishedMatches();
    } else if (isApiConfigured()) {
      await syncLive();
    } else {
      // Mode manuel : on règle quand même les matchs marqués terminés par l'admin
      settleFinishedMatches();
    }
  } catch (err) {
    console.error("[poller] tick failed:", err);
  } finally {
    schedule();
  }
}

function schedule(): void {
  const delay = isDemoMode() ? DEMO_MS : currentDelay;
  state.live = setTimeout(tick, delay);
}

/** Démarre le poller en arrière-plan. Idempotent. */
export function startPoller(): void {
  if (state.started) return;
  state.started = true;
  // Premier tick rapide au démarrage
  state.live = setTimeout(tick, 2_000);

  // Snapshot quotidien du classement à intervalle régulier (best-effort)
  state.daily = setInterval(
    () => {
      try {
        snapshotStandings();
      } catch (err) {
        console.error("[poller] snapshot failed:", err);
      }
    },
    6 * 60 * 60_000,
  );
  console.log(
    `[poller] démarré — mode ${
      isDemoMode() ? "DÉMO" : isApiConfigured() ? "API football-data" : "MANUEL"
    }`,
  );
}

/** Permet d'accélérer le poll quand un match passe en direct. */
export function setLiveMode(fast: boolean): void {
  currentDelay = fast ? FAST_MS : SLOW_MS;
}
