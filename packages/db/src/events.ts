import postgres from "postgres";

import { env } from "@watchdog/env/server";
import { isWatchdogEvent, type WatchdogEvent } from "@watchdog/schemas";

import { client } from "./client";

export { isWatchdogEvent, type WatchdogEvent };

export const WATCHDOG_CHANNEL = "watchdog_events";

/**
 * Emit a NOTIFY on the watchdog_events channel via the shared pool.
 */
export async function notifyEvent(event: WatchdogEvent): Promise<void> {
  await client.notify(WATCHDOG_CHANNEL, JSON.stringify(event));
}

/**
 * Open a dedicated LISTEN connection and call onNotification for each
 * message on watchdog_events. Returns a cleanup function.
 *
 * Used by the SSE route in apps/web — keeps postgres out of web's deps.
 */
export function listenForEvents(
  onNotification: (payload: string) => void,
  onReady?: () => void,
  onError?: (error: unknown) => void
): { end: () => Promise<void> } {
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 10,
  });

  void (async () => {
    try {
      await sql.listen(WATCHDOG_CHANNEL, onNotification, onReady);
    } catch (error) {
      onError?.(error);
    }
  })();

  return { end: async () => sql.end() };
}
