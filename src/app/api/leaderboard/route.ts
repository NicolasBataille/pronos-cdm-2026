import { computeLeaderboard } from "@/lib/game/leaderboard";
import { ok, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  return ok(computeLeaderboard());
});
