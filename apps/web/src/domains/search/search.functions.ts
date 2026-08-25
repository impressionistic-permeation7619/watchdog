import { createServerFn } from "@tanstack/react-start";

import {
  searchCaseInputSchema,
  type SearchCaseResult,
} from "@/domains/search/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";

export const searchCaseFn = createServerFn({ method: "GET" })
  .validator(searchCaseInputSchema)
  .handler(
    async ({ data, context }): Promise<SearchCaseResult> =>
      orpcForActor(actorFromSession(context.session)).search.case(data)
  );
