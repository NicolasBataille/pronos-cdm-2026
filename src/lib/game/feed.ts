import { db, events } from "@/lib/db";
import { broadcast } from "@/lib/realtime";

export function pushEvent(type: string, payload: Record<string, unknown>): void {
  db.insert(events)
    .values({ type, payload: JSON.stringify(payload), createdAt: new Date() })
    .run();
  broadcast({ type: "feed", payload: { type, ...payload } });
}
