import { sql } from "drizzle-orm";
import { db, bonusQuestions, matches } from "@/lib/db";
import { isDemoMode, seedDemo } from "@/lib/sync/demo";
import { isApiConfigured, syncFixtures, countMatches } from "@/lib/sync/football-data";
import { startPoller } from "@/lib/sync/poller";

const globalForBoot = globalThis as unknown as { __cdmBooted?: boolean };

/** Initialise les données et lance les tâches de fond. Idempotent, sûr à appeler plusieurs fois. */
export async function bootstrap(): Promise<void> {
  if (globalForBoot.__cdmBooted) return;
  globalForBoot.__cdmBooted = true;

  try {
    if (isDemoMode()) {
      seedDemo();
    } else if (isApiConfigured() && countMatches() === 0) {
      await syncFixtures().catch((err) => {
        console.error("[bootstrap] sync calendrier échoué (réessai au prochain poll):", err.message);
      });
      seedDefaultBonus();
    } else {
      seedDefaultBonus();
    }
    startPoller();
  } catch (err) {
    console.error("[bootstrap] erreur:", err);
  }
}

/** Questions bonus par défaut pour la vraie compétition. */
function seedDefaultBonus(): void {
  const existing = db.select({ c: sql<number>`count(*)` }).from(bonusQuestions).get();
  if ((existing?.c ?? 0) > 0) return;

  // Deadline = coup d'envoi du premier match, sinon dans 7 jours
  const first = db
    .select({ kickoff: matches.kickoff })
    .from(matches)
    .orderBy(sql`kickoff asc`)
    .limit(1)
    .get();
  const deadline = first?.kickoff ?? new Date(Date.now() + 7 * 24 * 60 * 60_000);

  db.insert(bonusQuestions)
    .values([
      {
        kind: "champion",
        label: "Qui sera champion du monde ?",
        description: "Désigne le grand vainqueur. Validé automatiquement à la finale.",
        points: 20,
        deadline,
      },
      {
        kind: "finalists",
        label: "Les deux finalistes",
        description: "Les deux équipes qui s'affronteront en finale (moitié des points par finaliste correct).",
        points: 12,
        deadline,
      },
      {
        kind: "top_scorer",
        label: "Meilleur buteur du tournoi",
        description: "Le Soulier d'Or. Validé par l'admin à la fin.",
        points: 10,
        deadline,
      },
    ])
    .onConflictDoNothing()
    .run();
}
