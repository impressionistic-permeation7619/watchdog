import { z } from "zod";

import { searchCase } from "@watchdog/core";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { searchCaseResultSchema } from "../schemas";

export const searchCaseProc = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/search",
    summary: "Search Active Case material and Cases by name",
    tags: ["search"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      q: z.string(),
      limit: z.number().int().min(1).max(50).optional(),
    })
  )
  .output(searchCaseResultSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      searchCase({
        caseId: input.caseId,
        q: input.q,
        limit: input.limit,
      })
    )
  );
