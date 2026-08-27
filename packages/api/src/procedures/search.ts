import { searchCase } from "@watchdog/core";
import { searchCaseInputSchema } from "@watchdog/schemas";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import { searchCaseResultSchema } from "../schemas";

export const searchCaseProc = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/search",
    summary: "Search Active Case material and Cases by name",
    tags: ["search"],
  })
  .input(searchCaseInputSchema)
  .output(searchCaseResultSchema)
  .handler(
    withDomainError(async ({ input }) =>
      searchCase({
        caseId: input.caseId,
        q: input.q,
        limit: input.limit,
      })
    )
  );
