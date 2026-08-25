import { useEffect, useEffectEvent } from "react";

import { isWatchdogEvent, type WatchdogEvent } from "@watchdog/schemas";

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

    const onJobUpdate = (e: Event) => {
      handleMessage(e, "job_update");
    };
    const onProposalCreated = (e: Event) => {
      handleMessage(e, "proposal_created");
    };
    const onEntityChanged = (e: Event) => {
      handleMessage(e, "entity_changed");
    };
    const onTaskChanged = (e: Event) => {
      handleMessage(e, "task_changed");
    };

    es.addEventListener("job_update", onJobUpdate);
    es.addEventListener("proposal_created", onProposalCreated);
    es.addEventListener("entity_changed", onEntityChanged);
    es.addEventListener("task_changed", onTaskChanged);

    return () => {
      es.removeEventListener("job_update", onJobUpdate);
      es.removeEventListener("proposal_created", onProposalCreated);
      es.removeEventListener("entity_changed", onEntityChanged);
      es.removeEventListener("task_changed", onTaskChanged);
      es.close();
    };
  }, [caseId]);
}
