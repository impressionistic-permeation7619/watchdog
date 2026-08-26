import { z } from "zod";

import {
  createEvent,
  deleteEvent,
  listEventsForEntity,
  updateEvent,
} from "@watchdog/core";

import { withDomainError } from "../map-domain-error";
import { authed, graphChildWrite } from "../os";
import { eventSchema, userOverrideSchema } from "../schemas";

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
  .handler(
    withDomainError(async ({ input }) =>
      listEventsForEntity(input.caseId, input.entityId)
    )
  );

export const create = graphChildWrite
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
      userOverride: userOverrideSchema,
    })
  )
  .output(eventSchema)
  .handler(withDomainError(async ({ input }) => createEvent(input)));

export const update = graphChildWrite
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
      userOverride: userOverrideSchema,
    })
  )
  .output(eventSchema)
  .handler(withDomainError(async ({ input }) => updateEvent(input)));

export const remove = graphChildWrite
  .route({
    method: "DELETE",
    path: "/cases/{caseId}/events/{eventId}",
    summary: "Delete a timeline event",
    tags: ["events"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      eventId: z.uuid(),
      userOverride: userOverrideSchema,
    })
  )
  .output(z.object({ ok: z.literal(true) }))
  .handler(
    withDomainError(async ({ input }) => {
      await deleteEvent(input.caseId, input.eventId);
      return { ok: true as const };
    })
  );
