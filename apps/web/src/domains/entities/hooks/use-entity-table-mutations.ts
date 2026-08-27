import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  createEdgeFn,
  updateEdgeFn,
} from "@/domains/entities/edges/edges.functions";
import {
  createEntityFn,
  updateEntityFieldsFn,
} from "@/domains/entities/entities.functions";
import {
  buildCreateEdgeData,
  buildUpdateEdgeData,
  type CreateEntityConnectionInput,
  type UpdateEntityConnectionInput,
} from "@/domains/entities/lib/edge-write";
import { errMessage, slugifyName } from "@/lib/utils";
import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";
import type { EntityKind } from "@watchdog/schemas";

export function useEntityTableMutations(caseId: string) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (vars: {
      entityId: string;
      kind?: EntityKind;
      summary?: string;
    }) =>
      updateEntityFieldsFn({
        data: {
          caseId,
          entityId: vars.entityId,
          ...(vars.kind === undefined ? {} : { kind: vars.kind }),
          ...(vars.summary === undefined ? {} : { summary: vars.summary }),
        },
      }),
    onSuccess: async () => {
      toast.success("Updated");
      await invalidateAfterEntityChanged(queryClient, caseId);
    },
    onError: (e) => {
      toast.error(errMessage(e, "Update failed"));
    },
  });

  const connectionMutation = useMutation({
    mutationFn: async (vars: {
      centerId: string;
      input: CreateEntityConnectionInput;
    }) =>
      createEdgeFn({
        data: buildCreateEdgeData({
          caseId,
          centerId: vars.centerId,
          core: vars.input,
        }),
      }),
    onSuccess: async (_data, vars) => {
      toast.success("Connection added");
      await invalidateAfterEntityChanged(queryClient, caseId, {
        entityId: vars.centerId,
      });
    },
  });

  const connectionUpdateMutation = useMutation({
    mutationFn: async (vars: {
      centerId: string;
      input: UpdateEntityConnectionInput;
    }) =>
      updateEdgeFn({
        data: buildUpdateEdgeData({
          caseId,
          centerId: vars.centerId,
          edgeId: vars.input.edgeId,
          core: vars.input,
          existing: {
            fromId: vars.input.existingFromId,
            toId: vars.input.existingToId,
            peerId: vars.input.existingPeerId,
          },
        }),
      }),
    onSuccess: async (_data, vars) => {
      toast.success("Connection updated");
      await invalidateAfterEntityChanged(queryClient, caseId, {
        entityId: vars.centerId,
      });
    },
  });

  const updateKind = useCallback(
    (entityId: string, kind: EntityKind) => {
      updateMutation.mutate({ entityId, kind });
    },
    [updateMutation]
  );

  const updateSummary = useCallback(
    (entityId: string, summary: string) => {
      updateMutation.mutate({ entityId, summary });
    },
    [updateMutation]
  );

  const createConnection = useCallback(
    async (centerId: string, input: CreateEntityConnectionInput) => {
      await connectionMutation.mutateAsync({ centerId, input });
    },
    [connectionMutation]
  );

  const updateConnection = useCallback(
    async (centerId: string, input: UpdateEntityConnectionInput) => {
      await connectionUpdateMutation.mutateAsync({ centerId, input });
    },
    [connectionUpdateMutation]
  );

  const createEntity = useCallback(
    async (name: string, kind: EntityKind) => {
      await createEntityFn({
        data: {
          caseId,
          kind,
          name,
          slug: slugifyName(name),
        },
      });
      toast.success("Entity created");
      await invalidateAfterEntityChanged(queryClient, caseId);
    },
    [caseId, queryClient]
  );

  return {
    updateKind,
    updateSummary,
    createConnection,
    updateConnection,
    createEntity,
  };
}
