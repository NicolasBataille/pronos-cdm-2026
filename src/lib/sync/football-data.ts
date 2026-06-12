import { eq, sql } from "drizzle-orm";
import { db, teams, matches, meta } from "@/lib/db";
import { broadcast } from "@/lib/realtime";
import { settleFinishedMatches } from "@/lib/game/settle";

const API = "https://api.football-data.org/v4";
// Identifiant de la compétition Coupe du Monde chez football-data.org
const COMPETITION = "WC";

interface FdTeam {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface FdMatch {
  id: number;
  stage: string;
  group: string | null;
  utcDate: string;
  status: string;
  minute?: number | string | null;
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    extraTime?: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
}

function mapStage(stage: string): string {
  // football-data utilise déjà GROUP_STAGE / LAST_16 / etc.
  return stage;
}

export function isApiConfigured(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_API_KEY);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY ?? "" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

function upsertTeam(t: FdTeam, group: string | null): number {
  const existing = db.select().from(teams).where(eq(teams.extId, t.id)).get();
  const values = {
    extId: t.id,
    name: t.name,
    shortName: t.shortName ?? t.name,
    tla: t.tla ?? "???",
    emblem: t.crest,
    groupName: group,
  };
  if (existing) {
    db.update(teams).set(values).where(eq(teams.id, existing.id)).run();
    return existing.id;
  }
  const inserted = db.insert(teams).values(values).returning({ id: teams.id }).get();
  return inserted.id;
}

/** Importe la structure du tournoi (équipes + calendrier). À lancer une fois, idempotent. */
export async function syncFixtures(): Promise<{ teams: number; matches: number }> {
  const data = (await fetchJson(`${API}/competitions/${COMPETITION}/matches`)) as {
    matches: FdMatch[];
  };

  let teamCount = 0;
  let matchCount = 0;

  for (const m of data.matches) {
    if (m.homeTeam.id == null || m.awayTeam.id == null) continue;
    const homeId = upsertTeam(
      { id: m.homeTeam.id, name: m.homeTeam.name ?? "?", shortName: null, tla: null, crest: null },
      m.group,
    );
    const awayId = upsertTeam(
      { id: m.awayTeam.id, name: m.awayTeam.name ?? "?", shortName: null, tla: null, crest: null },
      m.group,
    );
    teamCount += 2;

    upsertMatch(m, homeId, awayId);
    matchCount += 1;
  }

  db.insert(meta)
    .values({ key: "last_fixtures_sync", value: new Date().toISOString() })
    .onConflictDoUpdate({ target: meta.key, set: { value: new Date().toISOString() } })
    .run();

  return { teams: teamCount, matches: matchCount };
}

function resolvedScore(m: FdMatch): { home: number | null; away: number | null } {
  const ft = m.score.fullTime;
  const et = m.score.extraTime;
  if (et && et.home != null && et.away != null) {
    return { home: et.home, away: et.away };
  }
  return { home: ft.home, away: ft.away };
}

function upsertMatch(m: FdMatch, homeId: number, awayId: number): boolean {
  const existing = db.select().from(matches).where(eq(matches.extId, m.id)).get();
  const score = resolvedScore(m);
  const values = {
    extId: m.id,
    stage: mapStage(m.stage),
    groupName: m.group,
    kickoff: new Date(m.utcDate),
    homeTeamId: homeId,
    awayTeamId: awayId,
    status: m.status,
    homeScore: score.home,
    awayScore: score.away,
    winner: m.score.winner,
    minute: m.minute != null ? String(m.minute) : null,
  };

  if (existing) {
    const changed =
      existing.status !== values.status ||
      existing.homeScore !== values.homeScore ||
      existing.awayScore !== values.awayScore;
    db.update(matches).set(values).where(eq(matches.id, existing.id)).run();
    if (changed) {
      broadcast({
        type: "match_update",
        payload: { matchId: existing.id, status: values.status, ...score },
      });
    }
    return changed;
  }
  db.insert(matches).values({ ...values, settled: false }).run();
  return true;
}

/** Rafraîchit les scores en direct + règle les matchs terminés. Appelé par le poller. */
export async function syncLive(): Promise<{ updated: number; settled: number }> {
  if (!isApiConfigured()) return { updated: 0, settled: 0 };

  const data = (await fetchJson(`${API}/competitions/${COMPETITION}/matches`)) as {
    matches: FdMatch[];
  };

  let updated = 0;
  for (const m of data.matches) {
    if (m.homeTeam.id == null || m.awayTeam.id == null) continue;
    const homeId = upsertTeam(
      { id: m.homeTeam.id, name: m.homeTeam.name ?? "?", shortName: null, tla: null, crest: null },
      m.group,
    );
    const awayId = upsertTeam(
      { id: m.awayTeam.id, name: m.awayTeam.name ?? "?", shortName: null, tla: null, crest: null },
      m.group,
    );
    if (upsertMatch(m, homeId, awayId)) updated += 1;
  }

  const settled = settleFinishedMatches();
  return { updated, settled };
}

export function countMatches(): number {
  const r = db.select({ c: sql<number>`count(*)` }).from(matches).get();
  return r?.c ?? 0;
}
