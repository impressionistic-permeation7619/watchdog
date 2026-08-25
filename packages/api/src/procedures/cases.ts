import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  createCase,
  deleteCase,
  getCaseById,
  listCases,
  updateCase,
} from "@watchdog/core";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import {
  caseSchema,
  createCaseInputSchema,
  updateCaseInputSchema,
} from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases",
    summary: "List cases",
    tags: ["cases"],
  })
  .output(z.array(caseSchema))
  .handler(async () => mapDomainError(async () => listCases()));

export const get = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}",
    summary: "Get case by id",
    tags: ["cases"],
  })
  .input(z.object({ caseId: z.uuid() }))
  .output(caseSchema)
  .handler(async ({ input }) => {
    const row = await mapDomainError(async () => getCaseById(input.caseId));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Case not found" });
    return row;
  });

export const create = authed
  .route({
    method: "POST",
    path: "/cases",
    summary: "Create a case",
    tags: ["cases"],
    successStatus: 201,
  })
  .input(createCaseInputSchema)
  .output(caseSchema)
  .handler(async ({ input }) => mapDomainError(async () => createCase(input)));

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}",
    summary:
      "Update case name (regenerates slug), description, or third-party egress",
    tags: ["cases"],
  })
  .input(updateCaseInputSchema)
  .output(caseSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      updateCase({
        id: input.caseId,
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.description === undefined
          ? {}
          : { description: input.description }),
        ...(input.allowThirdPartyEgress === undefined
          ? {}
          : { allowThirdPartyEgress: input.allowThirdPartyEgress }),
      })
    )
  );

export const remove = authed
  .route({
    method: "DELETE",
    path: "/cases/{caseId}",
    summary: "Delete a case and cascaded graph / jobs / evidence",
    tags: ["cases"],
  })
  .input(z.object({ caseId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))
  .handler(async ({ input }) =>
    mapDomainError(async () => {
      await deleteCase(input.caseId);
      return { ok: true as const };
    })
  );
