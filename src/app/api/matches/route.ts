import { getCurrentUser } from "@/lib/auth";
import { getMatches } from "@/lib/game/matches-view";
import { ok, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  return ok(getMatches(user?.id ?? null));
});
