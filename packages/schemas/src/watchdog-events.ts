import { z } from "zod";

const watchdogEventSchemas = [
  z.object({
    type: z.literal("job_update"),
    caseId: z.string(),
    jobId: z.string(),
    status: z.string(),
  }),
  z.object({
    type: z.literal("proposal_created"),
    caseId: z.string(),
    proposalId: z.string(),
  }),
  z.object({
    type: z.literal("entity_changed"),
    caseId: z.string(),
  }),
  z.object({
    type: z.literal("task_changed"),
    caseId: z.string(),
    entityId: z.string().optional(),
  }),
] as const;

/** SSE / LISTEN-NOTIFY payload shapes. Shared by server emitters and the browser live-events hook. */
export const watchdogEventSchema = z.discriminatedUnion("type", [
  watchdogEventSchemas[0],
  watchdogEventSchemas[1],
  watchdogEventSchemas[2],
  watchdogEventSchemas[3],
]);

export type WatchdogEvent = z.infer<typeof watchdogEventSchema>;

export const WATCHDOG_EVENT_TYPES = watchdogEventSchemas.map(
  (schema) => schema.shape.type.value
);

/** Runtime guard for payloads read off the `watchdog_events` channel / SSE. */
export function isWatchdogEvent(value: unknown): value is WatchdogEvent {
  return watchdogEventSchema.safeParse(value).success;
}
