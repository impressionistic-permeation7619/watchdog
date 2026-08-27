import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { claimsListQuery } from "@/domains/entities/claims/queries";
import { edgesListQuery } from "@/domains/entities/edges/queries";
import { eventsListQuery } from "@/domains/entities/events/queries";
import { identifiersListQuery } from "@/domains/entities/identifiers/queries";
import { questionsListQuery } from "@/domains/entities/questions/queries";
import type { EntityRecord } from "@/domains/entities/types";
import { evidenceListQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import { tasksListQuery } from "@/domains/tasks/queries";

export interface DossierTabCounts {
  claims: number;
  identifiers: number;
  connections: number;
  evidence: number;
  events: number;
  questions: number;
  tasks: number;
}

function evidenceRecordMap(
  evidenceAll: EvidenceRecord[]
): Map<string, EvidenceRecord> {
  return new Map(evidenceAll.map((entry) => [entry.id, entry]));
}

function dossierTabCounts(
  claimsRaw: { retracted: boolean }[],
  identifiers: unknown[],
  edges: unknown[],
  events: unknown[],
  questions: { status: string }[],
  evidenceAll: { entityId: string | null }[],
  entityId: string,
  entityTasks: { status: string }[]
): DossierTabCounts {
  return {
    claims: claimsRaw.filter((claim) => !claim.retracted).length,
    identifiers: identifiers.length,
    connections: edges.length,
    events: events.length,
    questions: questions.filter((question) => question.status === "open")
      .length,
    evidence: evidenceAll.filter((entry) => entry.entityId === entityId).length,
    tasks: entityTasks.filter(
      (task) => task.status !== "done" && task.status !== "dropped"
    ).length,
  };
}

export function useDossierShellQueries(caseId: string, entity: EntityRecord) {
  const queryClient = useQueryClient();

  const { data: claimsRaw = [] } = useQuery(claimsListQuery(caseId, entity.id));
  const { data: identifiers = [] } = useQuery(
    identifiersListQuery(caseId, entity.id)
  );
  const { data: edges = [] } = useQuery(edgesListQuery(caseId, entity.id));
  const { data: events = [] } = useQuery(eventsListQuery(caseId, entity.id));
  const { data: questions = [] } = useQuery(
    questionsListQuery(caseId, entity.id)
  );
  const { data: entityTasks = [] } = useQuery(
    tasksListQuery(caseId, { entityId: entity.id })
  );
  const { data: evidenceAll = [], isPending: evidencePending } = useQuery(
    evidenceListQuery(caseId)
  );

  const [previewEvidence, setPreviewEvidence] = useState<EvidenceRecord | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const evidenceMap = useMemo(
    () => evidenceRecordMap(evidenceAll),
    [evidenceAll]
  );

  const handleEvidenceClick = useCallback(
    (evId: string) => {
      const ev = evidenceMap.get(evId);
      if (ev) setPreviewEvidence(ev);
    },
    [evidenceMap]
  );

  const counts = useMemo(
    () =>
      dossierTabCounts(
        claimsRaw,
        identifiers,
        edges,
        events,
        questions,
        evidenceAll,
        entity.id,
        entityTasks
      ),
    [
      claimsRaw,
      identifiers,
      edges,
      events,
      questions,
      evidenceAll,
      entity.id,
      entityTasks,
    ]
  );

  return {
    queryClient,
    claimsRaw,
    identifiers,
    edges,
    events,
    questions,
    entityTasks,
    evidenceAll,
    evidencePending,
    previewEvidence,
    setPreviewEvidence,
    editOpen,
    setEditOpen,
    editError,
    setEditError,
    evidenceMap,
    handleEvidenceClick,
    counts,
  };
}
