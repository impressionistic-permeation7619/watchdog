import { z } from "zod";

import {
  createEvent,
  deleteEvent,
  listEventsForEntity,
  updateEvent,
} from "@watchdog/core";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { eventSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities/{entityId}/events",
    summary: "List timeline events for an entity",
    tags: ["events"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
    })
  )
  .output(z.array(eventSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      listEventsForEntity(input.caseId, input.entityId)
    )
  );

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/entities/{entityId}/events",
    summary: "Create a timeline event",
    tags: ["events"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
      when: z.string().min(1),
      what: z.string().min(1),
      where: z.string().optional(),
    })
  )
  .output(eventSchema)
  .handler(async ({ input }) => mapDomainError(async () => createEvent(input)));

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/events/{eventId}",
    summary: "Update a timeline event",
    tags: ["events"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      eventId: z.uuid(),
      when: z.string().min(1),
      what: z.string().min(1),
      where: z.string().optional(),
    })
  )
  .output(eventSchema)
  .handler(async ({ input }) => mapDomainError(async () => updateEvent(input)));

export const remove = authed
  .route({
    method: "DELETE",
    path: "/cases/{caseId}/events/{eventId}",
    summary: "Delete a timeline event",
    tags: ["events"],
  })
  .input(z.object({ caseId: z.uuid(), eventId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))
  .handler(async ({ input }) =>
    mapDomainError(async () => {
      await deleteEvent(input.caseId, input.eventId);
      return { ok: true as const };
    })
  );
