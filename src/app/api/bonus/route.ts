import { z } from "zod";
import { and, eq, asc } from "drizzle-orm";
import { db, bonusQuestions, bonusAnswers } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { ok, ApiError, parseBody, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  const questions = db.select().from(bonusQuestions).orderBy(asc(bonusQuestions.deadline)).all();
  const myAnswers = user
    ? new Map(
        db
          .select()
          .from(bonusAnswers)
          .where(eq(bonusAnswers.userId, user.id))
          .all()
          .map((a) => [a.questionId, a]),
      )
    : new Map();

  return ok(
    questions.map((q) => {
      const mine = myAnswers.get(q.id);
      return {
        id: q.id,
        kind: q.kind,
        label: q.label,
        description: q.description,
        points: q.points,
        deadline: q.deadline.toISOString(),
        locked: Date.now() >= q.deadline.getTime(),
        settled: q.settled,
        answer: q.settled ? q.answer : null,
        myAnswer: mine?.answer ?? null,
        myPoints: mine?.points ?? null,
      };
    }),
  );
});

const schema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string().trim().min(1, "Réponse vide.").max(120),
});

export const POST = handler(async (req) => {
  const session = await requireUser();
  const body = await parseBody(req, schema);

  const q = db.select().from(bonusQuestions).where(eq(bonusQuestions.id, body.questionId)).get();
  if (!q) throw new ApiError("Question introuvable.", 404);
  if (Date.now() >= q.deadline.getTime()) throw new ApiError("Trop tard pour répondre.", 409);

  const existing = db
    .select()
    .from(bonusAnswers)
    .where(and(eq(bonusAnswers.userId, session.id), eq(bonusAnswers.questionId, q.id)))
    .get();

  const now = new Date();
  if (existing) {
    db.update(bonusAnswers)
      .set({ answer: body.answer, updatedAt: now })
      .where(eq(bonusAnswers.id, existing.id))
      .run();
  } else {
    db.insert(bonusAnswers)
      .values({ userId: session.id, questionId: q.id, answer: body.answer, updatedAt: now })
      .run();
  }

  return ok({ saved: true });
});
