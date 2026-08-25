import type { QueryClient } from "@tanstack/react-query";

import { edgesForCaseQuery } from "@/domains/entities/edges/queries";
import { identifiersForCaseQuery } from "@/domains/entities/identifiers/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { proposalsByStatusQuery } from "@/domains/inbox/queries";
import { evidenceListQuery } from "@/domains/intake/queries";
import { jobsListQuery } from "@/domains/jobs/queries";

/** Warm Case Overview dashboard lists without blocking navigation. */
export function warmCaseOverviewQueries(
  queryClient: QueryClient,
  caseId: string
): void {
  void queryClient.prefetchQuery(entitiesListQuery(caseId));
  void queryClient.prefetchQuery(identifiersForCaseQuery(caseId));
  void queryClient.prefetchQuery(edgesForCaseQuery(caseId));
  void queryClient.prefetchQuery(evidenceListQuery(caseId));
  void queryClient.prefetchQuery(jobsListQuery(caseId));
  void queryClient.prefetchQuery(proposalsByStatusQuery(caseId, "pending"));
}
