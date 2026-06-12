import { destroySession } from "@/lib/auth";
import { ok, handler } from "@/lib/api";

export const POST = handler(async () => {
  await destroySession();
  return ok({ ok: true });
});
