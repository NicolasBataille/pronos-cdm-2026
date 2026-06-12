import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { ok, parseBody, handler } from "@/lib/api";
import { settleQuestionManually } from "@/lib/game/settle-bonus";
import { broadcast } from "@/lib/realtime";

const schema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string().trim().min(1).max(120),
});

/** Validation manuelle d'une question bonus (ex: meilleur buteur). */
export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, schema);
  settleQuestionManually(body.questionId, body.answer);
  broadcast({ type: "leaderboard" });
  return ok({ settled: true });
});
