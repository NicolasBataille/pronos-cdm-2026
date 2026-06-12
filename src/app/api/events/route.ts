import { bus, type LiveEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

// Flux Server-Sent Events : pousse les mises à jour en temps réel aux clients.
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: LiveEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* flux fermé */
        }
      };

      // Évènement initial pour confirmer la connexion
      send({ type: "feed" });

      const listener = (event: LiveEvent) => send(event);
      bus.on("live", listener);

      // Heartbeat pour garder la connexion ouverte à travers les proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* ignore */
        }
      }, 25_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        bus.off("live", listener);
        try {
          controller.close();
        } catch {
          /* déjà fermé */
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
