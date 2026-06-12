import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ok, ApiError, parseBody, handler } from "@/lib/api";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Pseudo trop court (2 caractères min).")
    .max(20, "Pseudo trop long (20 max).")
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement."),
  displayName: z.string().trim().min(1).max(30).optional(),
  password: z.string().min(4, "Mot de passe trop court (4 caractères min).").max(100),
  avatar: z.string().trim().max(8).optional(),
  inviteCode: z.string(),
});

export const POST = handler(async (req) => {
  const body = await parseBody(req, schema);

  const expected = process.env.INVITE_CODE ?? "allez-les-bleus";
  if (body.inviteCode.trim() !== expected) {
    throw new ApiError("Code d'invitation incorrect.", 403);
  }

  const username = body.username.toLowerCase();
  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) throw new ApiError("Ce pseudo est déjà pris.", 409);

  const count = db.select({ c: sql<number>`count(*)` }).from(users).get();
  const isFirstUser = (count?.c ?? 0) === 0;

  const inserted = db
    .insert(users)
    .values({
      username,
      displayName: body.displayName?.trim() || body.username,
      avatar: body.avatar || "⚽",
      passwordHash: await hashPassword(body.password),
      isAdmin: isFirstUser, // le premier inscrit devient admin
      createdAt: new Date(),
    })
    .returning({ id: users.id })
    .get();

  await createSession(inserted.id);
  return ok({ id: inserted.id, isAdmin: isFirstUser });
});
