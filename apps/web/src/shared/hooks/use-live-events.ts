import { useEffect, useEffectEvent } from "react";

import {
  isWatchdogEvent,
  WATCHDOG_EVENT_TYPES,
  type WatchdogEvent,
} from "@watchdog/schemas";

type EventHandler = (event: WatchdogEvent) => void;

/**
 * Subscribe to live server events via SSE.
 *
 * Connects to /api/events?caseId=<caseId> and calls onEvent for each
 * received notification. Reconnects automatically on disconnect.
 *
 * @param caseId  Active case to filter events for. Pass null to skip.
 * @param onEvent Called for each WatchdogEvent received.
 */
export function useLiveEvents(
  caseId: string | null,
  onEvent: EventHandler
): void {
  // Always calls the latest onEvent without re-subscribing when it changes.
  const handleEvent = useEffectEvent(onEvent);

  useEffect(() => {
    // oxlint-disable-next-line unicorn/no-useless-undefined -- consistent-return requires an explicit value alongside the cleanup-returning branch below
    if (!caseId) return undefined;

    const url = `/api/events?caseId=${encodeURIComponent(caseId)}`;
    const es = new EventSource(url);

    function handleMessage(raw: Event, type: WatchdogEvent["type"]) {
      if (!(raw instanceof MessageEvent) || typeof raw.data !== "string") {
        return;
      }
      try {
        const parsed: unknown = JSON.parse(raw.data);
        const candidate =
          typeof parsed === "object" && parsed !== null
            ? { ...parsed, type }
            : { type };
        if (!isWatchdogEvent(candidate)) return;
        handleEvent(candidate);
      } catch {
        // Malformed — skip
      }
    }

    const listeners = WATCHDOG_EVENT_TYPES.map((type) => {
      const listener = (event: Event) => handleMessage(event, type);
      es.addEventListener(type, listener);
      return { type, listener };
    });

    return () => {
      for (const { type, listener } of listeners) {
        es.removeEventListener(type, listener);
      }
      es.close();
    };
  }, [caseId]);
}
