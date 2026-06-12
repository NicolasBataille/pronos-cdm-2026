import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, ApiError, parseBody, handler } from "@/lib/api";

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const POST = handler(async (req) => {
  const body = await parseBody(req, schema);
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, body.username.toLowerCase()))
    .get();

  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError("Pseudo ou mot de passe incorrect.", 401);
  }

  await createSession(user.id);
  return ok({ id: user.id, isAdmin: user.isAdmin });
});
