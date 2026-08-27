import { z } from "zod";

import type { EventRecord as CoreEventRecord } from "@watchdog/core";
import {
  nonEmptyTrimmed,
  optionalTrimmedSchema,
  uuidSchema,
} from "@watchdog/schemas";

export type EventRecord = CoreEventRecord;

export const entityScopeInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
});
export type EntityScopeInput = z.output<typeof entityScopeInputSchema>;

export const createEventInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
  when: nonEmptyTrimmed,
  what: nonEmptyTrimmed,
  where: optionalTrimmedSchema,
});
export type CreateEventInput = z.output<typeof createEventInputSchema>;

export const eventScopeInputSchema = z.object({
  caseId: uuidSchema,
  eventId: uuidSchema,
});
export type EventScopeInput = z.output<typeof eventScopeInputSchema>;

export const updateEventInputSchema = z.object({
  caseId: uuidSchema,
  eventId: uuidSchema,
  when: nonEmptyTrimmed,
  what: nonEmptyTrimmed,
  where: optionalTrimmedSchema,
});
export type UpdateEventInput = z.output<typeof updateEventInputSchema>;
