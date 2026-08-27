import { z } from "zod";

import { listRecentActivity } from "@watchdog/core";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import { activityItemSchema } from "../schemas";

export const listRecent = authed
  .route({
    method: "GET",
    path: "/activity/recent",
    summary: "List recent activity across cases",
    tags: ["activity"],
  })
  .input(
    z.object({
      caseId: z.uuid().optional(),
      limit: z.number().int().min(1).max(50).optional(),
    })
  )
  .output(z.array(activityItemSchema))
  .handler(
    withDomainError(async ({ input }) =>
      listRecentActivity({
        caseId: input.caseId,
        limit: input.limit,
      })
    )
  );
