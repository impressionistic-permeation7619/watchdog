import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { DossierEditFormValues } from "@/domains/dossier/components/dossier-edit-dialog";
import { claimsListQuery } from "@/domains/entities/claims/queries";
import { edgesListQuery } from "@/domains/entities/edges/queries";
import { updateEntityFieldsFn } from "@/domains/entities/entities.functions";
import { eventsListQuery } from "@/domains/entities/events/queries";
import { identifiersListQuery } from "@/domains/entities/identifiers/queries";
import { questionsListQuery } from "@/domains/entities/questions/queries";
import type { EntityRecord } from "@/domains/entities/types";
import { evidenceListQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import { tasksListQuery } from "@/domains/tasks/queries";
import { errMessage } from "@/lib/utils";
import { useLiveEvents } from "@/shared/hooks/use-live-events";
import {
  invalidateAfterEntityChanged,
  invalidateAfterTaskMutation,
} from "@/shared/lib/query-invalidation";

export interface DossierTabCounts {
  claims: number;
  identifiers: number;
  connections: number;
  evidence: number;
  events: number;
  questions: number;
  tasks: number;
}

export function useDossierShell(caseId: string, entity: EntityRecord) {
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
    () => new Map(evidenceAll.map((e) => [e.id, e])),
    [evidenceAll]
  );

  const handleEvidenceClick = useCallback(
    (evId: string) => {
      const ev = evidenceMap.get(evId);
      if (ev) setPreviewEvidence(ev);
    },
    [evidenceMap]
  );

  const counts: DossierTabCounts = useMemo(
    () => ({
      claims: claimsRaw.filter((c) => !c.retracted).length,
      identifiers: identifiers.length,
      connections: edges.length,
      events: events.length,
      questions: questions.filter((q) => q.status === "open").length,
      evidence: evidenceAll.filter((e) => e.entityId === entity.id).length,
      tasks: entityTasks.filter(
        (t) => t.status !== "done" && t.status !== "dropped"
      ).length,
    }),
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

  useLiveEvents(
    caseId,
    useCallback(
      (event) => {
        if (event.type === "entity_changed") {
          void invalidateAfterEntityChanged(
            queryClient,
            caseId,
            entity.id,
            entity.slug
          );
        }
        if (event.type === "task_changed") {
          void invalidateAfterTaskMutation(queryClient, caseId);
        }
      },
      [queryClient, caseId, entity.id, entity.slug]
    )
  );

  const renameMutation = useMutation({
    mutationFn: async (name: string) =>
      updateEntityFieldsFn({
        data: { caseId, entityId: entity.id, name },
      }),
    onSuccess: async () => {
      toast.success("Updated");
      await invalidateAfterEntityChanged(
        queryClient,
        caseId,
        entity.id,
        entity.slug
      );
    },
    onError: (err) => {
      toast.error(errMessage(err, "Rename failed"));
    },
  });

  const editMutation = useMutation({
    mutationFn: async (values: DossierEditFormValues) =>
      updateEntityFieldsFn({
        data: {
          caseId,
          entityId: entity.id,
          kind: values.kind,
          name: values.name,
          summary: values.summary,
          notes: values.notes,
        },
      }),
    onSuccess: async () => {
      setEditError(null);
      setEditOpen(false);
      toast.success("Updated");
      await invalidateAfterEntityChanged(
        queryClient,
        caseId,
        entity.id,
        entity.slug
      );
    },
    onError: (err) => {
      setEditError(errMessage(err, "Update failed"));
    },
  });

  return {
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
    renameMutation,
    editMutation,
  };
}
