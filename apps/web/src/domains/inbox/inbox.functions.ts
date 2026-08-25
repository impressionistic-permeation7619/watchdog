import { createServerFn } from "@tanstack/react-start";

import {
  acceptProposalInputSchema,
  listProposalsInputSchema,
  rejectProposalInputSchema,
} from "@/domains/inbox/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";
import type { ProposalRecord } from "@watchdog/core";

export { type ProposalRecord } from "@watchdog/core";

export const listProposalsFn = createServerFn({ method: "GET" })
  .validator(listProposalsInputSchema)
  .handler(
    async ({ data, context }): Promise<ProposalRecord[]> =>
      orpcForActor(actorFromSession(context.session)).proposals.listForCase({
        caseId: data.caseId,
        status: data.status ?? "pending",
      })
  );

export const acceptProposalFn = createServerFn({ method: "POST" })
  .validator(acceptProposalInputSchema)
  .handler(
    async ({ data, context }): Promise<ProposalRecord> =>
      orpcForActor(actorFromSession(context.session)).proposals.accept(data)
  );

export const rejectProposalFn = createServerFn({ method: "POST" })
  .validator(rejectProposalInputSchema)
  .handler(
    async ({ data, context }): Promise<ProposalRecord> =>
      orpcForActor(actorFromSession(context.session)).proposals.reject(data)
  );
