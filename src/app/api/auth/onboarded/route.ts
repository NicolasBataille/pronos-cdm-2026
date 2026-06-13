import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, handler } from "@/lib/api";

/** Marque l'onboarding comme vu pour l'utilisateur courant. */
export const POST = handler(async () => {
  const session = await requireUser();
  db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, session.id)).run();
  return ok({ ok: true });
});
