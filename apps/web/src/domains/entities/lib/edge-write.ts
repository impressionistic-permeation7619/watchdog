import type {
  CreateEdgeInput,
  UpdateEdgeInput,
} from "@/domains/entities/edges/types";
import type {
  EdgeOrientation,
  EdgePredicate,
  ConfidenceTier,
} from "@watchdog/schemas";
import { resolveEdgeEndpoints } from "@watchdog/schemas";

/** Shared create/update core (table + dossier). */
export interface ConnectionWriteCore {
  peerId: string;
  predicate: EdgePredicate;
  orientation: EdgeOrientation;
  notes?: string;
}

export function buildCreateEdgeData(opts: {
  caseId: string;
  centerId: string;
  core: ConnectionWriteCore;
  confidence?: ConfidenceTier;
  evidenceIds?: string[];
}): CreateEdgeInput {
  const { fromId, toId } = resolveEdgeEndpoints({
    entityId: opts.centerId,
    peerId: opts.core.peerId,
    predicate: opts.core.predicate,
    orientation: opts.core.orientation,
  });
  const notes = opts.core.notes?.trim();
  return {
    caseId: opts.caseId,
    fromId,
    toId,
    predicate: opts.core.predicate,
    confidence: opts.confidence ?? "unverified",
    viewEntityId: opts.centerId,
    notes: notes === "" ? undefined : notes,
    ...(opts.evidenceIds ? { evidenceIds: opts.evidenceIds } : {}),
  };
}

export function buildUpdateEdgeData(opts: {
  caseId: string;
  centerId: string;
  edgeId: string;
  core: ConnectionWriteCore;
  existing: { fromId: string; toId: string; peerId: string };
  confidence?: ConfidenceTier;
  evidenceIds?: string[];
}): UpdateEdgeInput {
  const { fromId, toId } = resolveEdgeEndpoints({
    entityId: opts.centerId,
    peerId: opts.core.peerId,
    predicate: opts.core.predicate,
    orientation: opts.core.orientation,
    existing: opts.existing,
  });
  const patch: UpdateEdgeInput = {
    caseId: opts.caseId,
    edgeId: opts.edgeId,
    viewEntityId: opts.centerId,
    fromId,
    toId,
    predicate: opts.core.predicate,
    notes: opts.core.notes?.trim() ? opts.core.notes.trim() : "",
  };
  if (opts.confidence !== undefined) {
    patch.confidence = opts.confidence;
  }
  if (opts.evidenceIds) {
    patch.evidenceIds = opts.evidenceIds;
  }
  return patch;
}

/** Compact table DTO (unverified, no evidence). */
export type CreateEntityConnectionInput = ConnectionWriteCore;

export interface UpdateEntityConnectionInput extends ConnectionWriteCore {
  edgeId: string;
  existingFromId: string;
  existingToId: string;
  /** Peer before this edit (for endpoint resolution). */
  existingPeerId: string;
}
