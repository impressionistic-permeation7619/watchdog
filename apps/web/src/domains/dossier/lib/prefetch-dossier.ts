import type { QueryClient } from "@tanstack/react-query";

import { claimsListQuery } from "@/domains/entities/claims/queries";
import { edgesListQuery } from "@/domains/entities/edges/queries";
import { eventsListQuery } from "@/domains/entities/events/queries";
import { identifiersListQuery } from "@/domains/entities/identifiers/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { questionsListQuery } from "@/domains/entities/questions/queries";
import { evidenceListQuery } from "@/domains/intake/queries";
import { tasksListQuery } from "@/domains/tasks/queries";

export type DossierPrefetchTab =
  | "overview"
  | "notes"
  | "claims"
  | "identifiers"
  | "connections"
  | "evidence"
  | "events"
  | "questions"
  | "tasks";

/**
 * Warm dossier Query keys without blocking navigation.
 * Intent preload / loader should `await` only the entity; call this with `void`.
 */
export function warmDossierQueries(
  queryClient: QueryClient,
  caseId: string,
  entityId: string,
  tab: DossierPrefetchTab = "overview"
): void {
  // Tab counts + overview share these — prefetch all lightly.
  void queryClient.prefetchQuery(claimsListQuery(caseId, entityId));
  void queryClient.prefetchQuery(identifiersListQuery(caseId, entityId));
  void queryClient.prefetchQuery(edgesListQuery(caseId, entityId));
  void queryClient.prefetchQuery(eventsListQuery(caseId, entityId));
  void queryClient.prefetchQuery(questionsListQuery(caseId, entityId));
  void queryClient.prefetchQuery(tasksListQuery(caseId, { entityId }));
  void queryClient.prefetchQuery(evidenceListQuery(caseId));

  if (tab === "connections" || tab === "overview") {
    void queryClient.prefetchQuery(entitiesListQuery(caseId));
  }
}
