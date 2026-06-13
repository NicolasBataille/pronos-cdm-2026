import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, handler } from "@/lib/api";

export const GET = handler(async () => {
  const session = await getCurrentUser();
  if (!session) return ok(null);
  const user = db.select().from(users).where(eq(users.id, session.id)).get();
  return ok({
    id: session.id,
    username: session.username,
    displayName: session.displayName,
    avatar: session.avatar,
    isAdmin: session.isAdmin,
    doublesLeft: user?.doublesLeft ?? 0,
    bancosLeft: user?.bancosLeft ?? 0,
    onboarded: user?.onboardedAt != null,
  });
});
