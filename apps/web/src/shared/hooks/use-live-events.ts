import { useEffect, useEffectEvent } from "react";

import {
  isWatchdogEvent,
  WATCHDOG_EVENT_TYPES,
  type WatchdogEvent,
} from "@watchdog/schemas";

type EventHandler = (event: WatchdogEvent) => void;

function parseWatchdogEvent(
  raw: Event,
  type: WatchdogEvent["type"]
): WatchdogEvent | null {
  if (!(raw instanceof MessageEvent) || typeof raw.data !== "string") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw.data);
    const candidate =
      typeof parsed === "object" && parsed !== null
        ? { ...parsed, type }
        : { type };
    return isWatchdogEvent(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function createTypedEventListener(
  type: WatchdogEvent["type"],
  handleEvent: EventHandler
): (event: Event) => void {
  return (event: Event) => {
    const parsed = parseWatchdogEvent(event, type);
    if (parsed) handleEvent(parsed);
  };
}

function subscribeLiveEvents(
  caseId: string,
  handleEvent: EventHandler
): () => void {
  const url = `/api/events?caseId=${encodeURIComponent(caseId)}`;
  const es = new EventSource(url);

  const listeners = WATCHDOG_EVENT_TYPES.map((type) => {
    const listener = createTypedEventListener(type, handleEvent);
    es.addEventListener(type, listener);
    return { type, listener };
  });

  return () => {
    for (const { type, listener } of listeners) {
      es.removeEventListener(type, listener);
    }
    es.close();
  };
}

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
  const handleEvent = useEffectEvent(onEvent);

  useEffect(() => {
    // oxlint-disable-next-line unicorn/no-useless-undefined -- consistent-return requires an explicit value alongside the cleanup-returning branch below
    if (!caseId) return undefined;
    return subscribeLiveEvents(caseId, handleEvent);
  }, [caseId]);
}
