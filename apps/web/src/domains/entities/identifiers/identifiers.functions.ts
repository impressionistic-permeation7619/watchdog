import { createServerFn } from "@tanstack/react-start";

import {
  caseScopeInputSchema,
  createIdentifierInputSchema,
  entityScopeInputSchema,
  updateIdentifierInputSchema,
  type CaseIdentifierRecord,
  type IdentifierRecord,
} from "@/domains/entities/identifiers/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";

export type {
  CaseIdentifierRecord,
  IdentifierRecord,
} from "@/domains/entities/identifiers/types";

export const listIdentifiersFn = createServerFn({ method: "GET" })
  .validator(entityScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<IdentifierRecord[]> =>
      orpcForActor(actorFromSession(context.session)).identifiers.list({
        caseId: data.caseId,
        entityId: data.entityId,
      })
  );

export const listIdentifiersForCaseFn = createServerFn({ method: "GET" })
  .validator(caseScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<CaseIdentifierRecord[]> =>
      orpcForActor(actorFromSession(context.session)).identifiers.listForCase({
        caseId: data.caseId,
      })
  );

export const createIdentifierFn = createServerFn({ method: "POST" })
  .validator(createIdentifierInputSchema)
  .handler(
    async ({ data, context }): Promise<IdentifierRecord> =>
      orpcForActor(actorFromSession(context.session)).identifiers.create(data)
  );

export const updateIdentifierFn = createServerFn({ method: "POST" })
  .validator(updateIdentifierInputSchema)
  .handler(
    async ({ data, context }): Promise<IdentifierRecord> =>
      orpcForActor(actorFromSession(context.session)).identifiers.update(data)
  );
