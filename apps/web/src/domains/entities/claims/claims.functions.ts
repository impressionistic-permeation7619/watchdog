import { createServerFn } from "@tanstack/react-start";

import {
  createClaimInputSchema,
  listClaimsInputSchema,
  retractClaimInputSchema,
  updateClaimInputSchema,
  type ClaimRecord,
} from "@/domains/entities/claims/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";

export type { ClaimRecord } from "@/domains/entities/claims/types";

export const listClaimsFn = createServerFn({ method: "GET" })
  .validator(listClaimsInputSchema)
  .handler(
    async ({ data, context }): Promise<ClaimRecord[]> =>
      orpcForActor(actorFromSession(context.session)).claims.list({
        caseId: data.caseId,
        entityId: data.entityId,
        includeRetracted: data.includeRetracted,
      })
  );

export const createClaimFn = createServerFn({ method: "POST" })
  .validator(createClaimInputSchema)
  .handler(
    async ({ data, context }): Promise<ClaimRecord> =>
      orpcForActor(actorFromSession(context.session)).claims.create(data)
  );

export const retractClaimFn = createServerFn({ method: "POST" })
  .validator(retractClaimInputSchema)
  .handler(
    async ({ data, context }): Promise<ClaimRecord> =>
      orpcForActor(actorFromSession(context.session)).claims.retract(data)
  );

export const updateClaimFn = createServerFn({ method: "POST" })
  .validator(updateClaimInputSchema)
  .handler(
    async ({ data, context }): Promise<ClaimRecord> =>
      orpcForActor(actorFromSession(context.session)).claims.update(data)
  );
