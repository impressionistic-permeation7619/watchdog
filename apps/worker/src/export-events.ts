import { scheduleCaseExport, type WatchdogEvent } from "@watchdog/core";

export function shouldTriggerCaseExport(event: WatchdogEvent): boolean {
  switch (event.type) {
    case "job_update": {
      return event.status === "succeeded";
    }
    case "entity_changed":
    case "proposal_created": {
      return true;
    }
    case "task_changed": {
      return false;
    }
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

export function handleExportEvent(event: WatchdogEvent): void {
  if (shouldTriggerCaseExport(event)) {
    void scheduleCaseExport(event.caseId);
  }
}
