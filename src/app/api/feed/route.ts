import { desc } from "drizzle-orm";
import { db, events } from "@/lib/db";
import { ok, handler } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const rows = db.select().from(events).orderBy(desc(events.createdAt)).limit(50).all();
  return ok(
    rows.map((e) => ({
      id: e.id,
      type: e.type,
      ...(JSON.parse(e.payload) as Record<string, unknown>),
      createdAt: e.createdAt.toISOString(),
    })),
  );
});
