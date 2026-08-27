/**
 * GET /api/events
 *
 * Server-Sent Events endpoint. Uses listenForEvents() from @watchdog/db
 * (which holds the postgres dep) to stream notifications to the browser.
 *
 * Query params:
 *   caseId  — filter events to this Case (optional)
 *
 * Auth: session cookie, Bearer token, or x-api-key (same as OpenAPI routes).
 */
import { createFileRoute } from "@tanstack/react-router";

import { createApiContext } from "@/auth/api-context.server";
import {
  applyWatchdogCors,
  corsPreflightResponse,
} from "@/lib/api-cors.server";
import { isWatchdogEvent, listenForEvents } from "@watchdog/db";

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      OPTIONS: async ({ request }: { request: Request }) =>
        corsPreflightResponse(request) ?? new Response(null, { status: 204 }),
      GET: async ({ request }: { request: Request }) => {
        const ctx = await createApiContext(request);
        if (!ctx.actor) {
          return new Response("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const caseId = url.searchParams.get("caseId") ?? null;

        const stream = new ReadableStream({
          start(controller) {
            const enc = new TextEncoder();
            let closed = false;
            let listener: ReturnType<typeof listenForEvents> | undefined;

            // Heartbeat to keep connection alive through proxies
            const heartbeat = setInterval(() => {
              try {
                controller.enqueue(enc.encode(": heartbeat\n\n"));
              } catch {
                clearInterval(heartbeat);
              }
            }, 25_000);

            function send(eventType: string, data: string) {
              try {
                controller.enqueue(
                  enc.encode(`event: ${eventType}\ndata: ${data}\n\n`)
                );
              } catch {
                // client disconnected
              }
            }

            function closeStream(errorMessage?: string) {
              if (closed) return;
              closed = true;
              clearInterval(heartbeat);
              void listener?.end();
              if (errorMessage !== undefined) {
                send("error", JSON.stringify({ message: errorMessage }));
              }
              try {
                controller.close();
              } catch {
                // already closed
              }
            }

            listener = listenForEvents(
              (rawPayload) => {
                try {
                  const parsed: unknown = JSON.parse(rawPayload);
                  if (!isWatchdogEvent(parsed)) return;
                  if (caseId && parsed.caseId !== caseId) {
                    return;
                  }
                  send(parsed.type, rawPayload);
                } catch {
                  // malformed — skip
                }
              },
              () => {
                send("connected", JSON.stringify({ ok: true }));
              },
              (error: unknown) => {
                closeStream(
                  error instanceof Error ? error.message : String(error)
                );
              }
            );

            request.signal.addEventListener("abort", () => {
              closeStream();
            });
          },
        });

        return applyWatchdogCors(
          request,
          new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
            },
          })
        );
      },
    },
  },
});
