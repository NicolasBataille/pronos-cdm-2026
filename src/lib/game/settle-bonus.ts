import { and, eq } from "drizzle-orm";
import { db, matches, teams, bonusQuestions, bonusAnswers } from "@/lib/db";
import { pushEvent } from "./feed";

/**
 * Auto-validation des questions bonus dont la réponse peut être déduite
 * des résultats (champion, finalistes). Le meilleur buteur est validé
 * par l'admin depuis l'interface.
 */
export function settleBonusQuestions(): void {
  settleChampion();
  settleFinalists();
}

function teamName(teamId: number | null): string | null {
  if (teamId == null) return null;
  const t = db.select().from(teams).where(eq(teams.id, teamId)).get();
  return t?.name ?? null;
}

function settleChampion(): void {
  const q = db
    .select()
    .from(bonusQuestions)
    .where(and(eq(bonusQuestions.kind, "champion"), eq(bonusQuestions.settled, false)))
    .get();
  if (!q) return;

  const final = db
    .select()
    .from(matches)
    .where(and(eq(matches.stage, "FINAL"), eq(matches.status, "FINISHED")))
    .get();
  if (!final || !final.winner || final.winner === "DRAW") return;

  const champion = teamName(
    final.winner === "HOME_TEAM" ? final.homeTeamId : final.awayTeamId,
  );
  if (!champion) return;

  gradeExactAnswers(q.id, champion, q.points);
  db.update(bonusQuestions)
    .set({ answer: champion, settled: true })
    .where(eq(bonusQuestions.id, q.id))
    .run();
  pushEvent("bonus_settled", {
    emoji: "🏆",
    message: `${champion} remporte la Coupe du Monde ! Les pronos « Champion » sont comptabilisés.`,
  });
}

function settleFinalists(): void {
  const q = db
    .select()
    .from(bonusQuestions)
    .where(and(eq(bonusQuestions.kind, "finalists"), eq(bonusQuestions.settled, false)))
    .get();
  if (!q) return;

  const final = db.select().from(matches).where(eq(matches.stage, "FINAL")).get();
  if (!final || final.homeTeamId == null || final.awayTeamId == null) return;

  const names = [teamName(final.homeTeamId), teamName(final.awayTeamId)].filter(
    (n): n is string => n != null,
  );
  if (names.length !== 2) return;

  // La moitié des points par finaliste correctement prédit
  const perTeam = Math.floor(q.points / 2);
  const answers = db.select().from(bonusAnswers).where(eq(bonusAnswers.questionId, q.id)).all();
  for (const a of answers) {
    const picked = a.answer.split("|").map((s) => s.trim().toLowerCase());
    const hits = names.filter((n) => picked.includes(n.toLowerCase())).length;
    db.update(bonusAnswers)
      .set({ points: hits * perTeam })
      .where(eq(bonusAnswers.id, a.id))
      .run();
  }

  db.update(bonusQuestions)
    .set({ answer: names.join("|"), settled: true })
    .where(eq(bonusQuestions.id, q.id))
    .run();
  pushEvent("bonus_settled", {
    emoji: "🎟️",
    message: `Affiche de la finale connue : ${names.join(" vs ")} ! Pronos « Finalistes » comptabilisés.`,
  });
}

/** Validation admin (ex: meilleur buteur) : compare la réponse exacte, insensible à la casse. */
export function settleQuestionManually(questionId: number, answer: string): void {
  const q = db.select().from(bonusQuestions).where(eq(bonusQuestions.id, questionId)).get();
  if (!q || q.settled) return;
  gradeExactAnswers(q.id, answer, q.points);
  db.update(bonusQuestions)
    .set({ answer, settled: true })
    .where(eq(bonusQuestions.id, q.id))
    .run();
  pushEvent("bonus_settled", {
    emoji: "⚽",
    message: `Question bonus « ${q.label} » validée : ${answer}.`,
  });
}

function gradeExactAnswers(questionId: number, answer: string, points: number): void {
  const answers = db
    .select()
    .from(bonusAnswers)
    .where(eq(bonusAnswers.questionId, questionId))
    .all();
  for (const a of answers) {
    const ok = a.answer.trim().toLowerCase() === answer.trim().toLowerCase();
    db.update(bonusAnswers)
      .set({ points: ok ? points : 0 })
      .where(eq(bonusAnswers.id, a.id))
      .run();
  }
}
