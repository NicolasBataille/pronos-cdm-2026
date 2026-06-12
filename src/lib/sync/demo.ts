import { eq, sql, and } from "drizzle-orm";
import { db, teams, matches, meta, bonusQuestions } from "@/lib/db";
import { broadcast } from "@/lib/realtime";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1";
}

const DEMO_TEAMS = [
  { name: "France", tla: "FRA", emblem: "🇫🇷", group: "A" },
  { name: "Argentine", tla: "ARG", emblem: "🇦🇷", group: "A" },
  { name: "Brésil", tla: "BRA", emblem: "🇧🇷", group: "A" },
  { name: "Allemagne", tla: "GER", emblem: "🇩🇪", group: "A" },
  { name: "Espagne", tla: "ESP", emblem: "🇪🇸", group: "B" },
  { name: "Angleterre", tla: "ENG", emblem: "🏴", group: "B" },
  { name: "Portugal", tla: "POR", emblem: "🇵🇹", group: "B" },
  { name: "Pays-Bas", tla: "NED", emblem: "🇳🇱", group: "B" },
];

// Buts simulés par match : déterministe pour rester reproductible sans Math.random
const DEMO_SCRIPT: Array<[number, number]> = [
  [2, 1],
  [0, 0],
  [3, 1],
  [1, 1],
  [2, 2],
  [0, 1],
  [1, 0],
  [4, 2],
  [2, 0],
  [1, 3],
  [0, 2],
  [3, 3],
];

/** Crée 12 matchs démo si la base est vide. Chaque match dure ~60s en temps accéléré. */
export function seedDemo(): void {
  const count = db.select({ c: sql<number>`count(*)` }).from(matches).get();
  if ((count?.c ?? 0) > 0) return;

  const teamIds: number[] = [];
  for (const t of DEMO_TEAMS) {
    const inserted = db
      .insert(teams)
      .values({
        name: t.name,
        shortName: t.name,
        tla: t.tla,
        emblem: t.emblem,
        groupName: t.group,
      })
      .returning({ id: teams.id })
      .get();
    teamIds.push(inserted.id);
  }

  // Génère des affiches : 12 matchs de groupe
  const pairs: Array<[number, number]> = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 3],
    [1, 2],
    [4, 7],
    [5, 6],
  ];

  const base = Date.now();
  // Le premier match démarre 40s après le seed pour laisser le temps de pronostiquer
  pairs.forEach(([h, a], i) => {
    db.insert(matches)
      .values({
        stage: "GROUP_STAGE",
        groupName: i < 8 ? (i % 2 === 0 ? "A" : "B") : i % 2 === 0 ? "A" : "B",
        kickoff: new Date(base + 40_000 + i * 30_000),
        homeTeamId: teamIds[h],
        awayTeamId: teamIds[a],
        status: "TIMED",
        settled: false,
      })
      .run();
  });

  seedDemoBonus(base);
  db.insert(meta)
    .values({ key: "demo_seeded", value: new Date().toISOString() })
    .onConflictDoUpdate({ target: meta.key, set: { value: new Date().toISOString() } })
    .run();
}

function seedDemoBonus(base: number): void {
  const existing = db.select({ c: sql<number>`count(*)` }).from(bonusQuestions).get();
  if ((existing?.c ?? 0) > 0) return;
  db.insert(bonusQuestions)
    .values([
      {
        kind: "champion",
        label: "Qui sera champion du monde ?",
        description: "Désigne le vainqueur final. Gros points en jeu !",
        points: 15,
        deadline: new Date(base + 40_000),
      },
      {
        kind: "top_scorer",
        label: "Meilleur buteur du tournoi",
        description: "Le joueur qui finira meilleur buteur (validé par l'admin).",
        points: 10,
        deadline: new Date(base + 40_000),
      },
    ])
    .run();
}

const DEMO_DURATION_MS = 60_000; // un match dure 60s
const HALF = DEMO_DURATION_MS / 2;

/**
 * Fait avancer les matchs démo selon l'horloge réelle.
 * Un match passe TIMED -> IN_PLAY -> FINISHED, avec des buts qui tombent progressivement.
 */
export function tickDemo(): void {
  const now = Date.now();
  const all = db.select().from(matches).where(eq(matches.stage, "GROUP_STAGE")).all();

  all.forEach((m, idx) => {
    const start = m.kickoff.getTime();
    const elapsed = now - start;
    const [finalH, finalA] = DEMO_SCRIPT[idx % DEMO_SCRIPT.length];

    if (elapsed < 0) return; // pas encore commencé
    if (m.status === "FINISHED") return;

    if (elapsed >= DEMO_DURATION_MS) {
      finishDemoMatch(m.id, finalH, finalA);
      return;
    }

    // En cours : on révèle les buts proportionnellement au temps écoulé
    const progress = elapsed / DEMO_DURATION_MS;
    const h = Math.min(finalH, Math.floor(finalH * progress + 0.4));
    const a = Math.min(finalA, Math.floor(finalA * progress + 0.4));
    const minute = Math.min(90, Math.floor(progress * 90));

    if (m.status !== "IN_PLAY" || m.homeScore !== h || m.awayScore !== a) {
      db.update(matches)
        .set({ status: "IN_PLAY", homeScore: h, awayScore: a, minute: `${minute}'` })
        .where(eq(matches.id, m.id))
        .run();
      broadcast({
        type: "match_update",
        payload: { matchId: m.id, status: "IN_PLAY", home: h, away: a, minute: `${minute}'` },
      });
    }
    void HALF;
  });
}

function finishDemoMatch(matchId: number, h: number, a: number): void {
  const winner = h > a ? "HOME_TEAM" : h < a ? "AWAY_TEAM" : "DRAW";
  db.update(matches)
    .set({ status: "FINISHED", homeScore: h, awayScore: a, winner, minute: "FT" })
    .where(and(eq(matches.id, matchId), eq(matches.status, "IN_PLAY")))
    .run();
  // Cas où le match n'était jamais passé IN_PLAY (tick trop espacé)
  db.update(matches)
    .set({ status: "FINISHED", homeScore: h, awayScore: a, winner, minute: "FT" })
    .where(and(eq(matches.id, matchId), eq(matches.status, "TIMED")))
    .run();
  broadcast({
    type: "match_update",
    payload: { matchId, status: "FINISHED", home: h, away: a },
  });
}
