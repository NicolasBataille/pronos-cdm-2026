import { isApiConfigured } from "@/lib/sync/football-data";
import { isDemoMode } from "@/lib/sync/demo";
import { ok, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const mode = isDemoMode() ? "demo" : isApiConfigured() ? "api" : "manual";
  return ok({ mode });
});
