import { z } from "zod";

import {
  createQuestion,
  listQuestionsForEntity,
  reopenQuestion,
  resolveQuestion,
  updateQuestion,
} from "@watchdog/core";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { questionSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities/{entityId}/questions",
    summary: "List questions for an entity",
    tags: ["questions"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
    })
  )
  .output(z.array(questionSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      listQuestionsForEntity(input.caseId, input.entityId)
    )
  );

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/entities/{entityId}/questions",
    summary: "Create a question",
    tags: ["questions"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
      text: z.string().min(1),
    })
  )
  .output(questionSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => createQuestion(input))
  );

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/questions/{questionId}",
    summary: "Update a question",
    tags: ["questions"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      questionId: z.uuid(),
      text: z.string().min(1).optional(),
      resolvedNote: z.string().nullable().optional(),
    })
  )
  .output(questionSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => updateQuestion(input))
  );

export const resolve = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/questions/{questionId}/resolve",
    summary: "Resolve a question",
    tags: ["questions"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      questionId: z.uuid(),
      resolvedNote: z.string().optional(),
    })
  )
  .output(questionSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => resolveQuestion(input))
  );

export const reopen = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/questions/{questionId}/reopen",
    summary: "Reopen a resolved question",
    tags: ["questions"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      questionId: z.uuid(),
    })
  )
  .output(questionSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => reopenQuestion(input))
  );
