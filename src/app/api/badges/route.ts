import { desc, eq } from "drizzle-orm";
import { db, badges } from "@/lib/db";
import { BADGE_DEFS, BADGE_MAP } from "@/lib/game/badges";
import { getCurrentUser } from "@/lib/auth";
import { ok, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");
  const session = await getCurrentUser();
  const userId = userIdParam ? Number(userIdParam) : session?.id;
  if (!userId) return ok({ owned: [], all: BADGE_DEFS });

  const owned = db
    .select()
    .from(badges)
    .where(eq(badges.userId, userId))
    .orderBy(desc(badges.awardedAt))
    .all();

  return ok({
    owned: owned.map((b) => ({
      ...BADGE_MAP.get(b.badgeId),
      badgeId: b.badgeId,
      awardedAt: b.awardedAt.toISOString(),
    })),
    all: BADGE_DEFS,
  });
});
