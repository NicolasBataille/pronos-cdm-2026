import { requireAdmin } from "@/lib/admin";
import { ok, ApiError, handler } from "@/lib/api";
import { syncFixtures, syncLive, isApiConfigured } from "@/lib/sync/football-data";

/** Force une resynchronisation du calendrier + des scores depuis football-data. */
export const POST = handler(async () => {
  await requireAdmin();
  if (!isApiConfigured()) {
    throw new ApiError("Aucune clé API football-data configurée.", 400);
  }
  const fixtures = await syncFixtures();
  const live = await syncLive();
  return ok({ fixtures, live });
});
