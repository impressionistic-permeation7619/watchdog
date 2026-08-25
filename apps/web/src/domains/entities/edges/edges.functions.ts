import { createServerFn } from "@tanstack/react-start";

import {
  caseScopeInputSchema,
  createEdgeInputSchema,
  edgeScopeInputSchema,
  entityScopeInputSchema,
  updateEdgeInputSchema,
  type CaseEdgeRecord,
  type EdgeRecord,
} from "@/domains/entities/edges/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";

export type {
  CaseEdgeRecord,
  EdgeRecord,
} from "@/domains/entities/edges/types";

export const listEdgesFn = createServerFn({ method: "GET" })
  .validator(entityScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<EdgeRecord[]> =>
      orpcForActor(actorFromSession(context.session)).edges.list({
        caseId: data.caseId,
        entityId: data.entityId,
      })
  );

export const listEdgesForCaseFn = createServerFn({ method: "GET" })
  .validator(caseScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<CaseEdgeRecord[]> =>
      orpcForActor(actorFromSession(context.session)).edges.listForCase({
        caseId: data.caseId,
      })
  );

export const createEdgeFn = createServerFn({ method: "POST" })
  .validator(createEdgeInputSchema)
  .handler(
    async ({ data, context }): Promise<EdgeRecord> =>
      orpcForActor(actorFromSession(context.session)).edges.create(data)
  );

export const updateEdgeFn = createServerFn({ method: "POST" })
  .validator(updateEdgeInputSchema)
  .handler(
    async ({ data, context }): Promise<EdgeRecord> =>
      orpcForActor(actorFromSession(context.session)).edges.update(data)
  );

export const deleteEdgeFn = createServerFn({ method: "POST" })
  .validator(edgeScopeInputSchema)
  .handler(async ({ data, context }): Promise<void> => {
    await orpcForActor(actorFromSession(context.session)).edges.delete(data);
  });
