import {
  CLAIM_CLASSES,
  EDGE_PREDICATES,
  ENTITY_KINDS,
  IDENTIFIER_STATUSES,
  IDENTIFIER_TYPES,
  type ConfidenceTier,
  type JsonValue,
  type PatchOp,
} from "@watchdog/schemas";

import { patchNeedsConfidence } from "./patch-needs-confidence";

export interface PatchGateOpts {
  confidence?: ConfidenceTier;
  sharedEvidenceIds?: string[];
}

export function requireString(
  data: Record<string, JsonValue>,
  key: string
): string {
  const v = data[key];
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`${key} is required`);
  }
  return v.trim();
}

export function isOneOf<T extends string>(
  value: string,
  allowed: readonly T[]
): value is T {
  const widened: readonly string[] = allowed;
  return widened.includes(value);
}

export function requireEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string
): T {
  if (isOneOf(value, allowed)) {
    return value;
  }
  throw new Error(`Invalid ${label}: ${value}`);
}

function assertOpShape(op: PatchOp): void {
  switch (op.resource) {
    case "claim": {
      if (op.op !== "create") throw new Error("claim only supports create");
      requireString(op.data, "entityId");
      requireString(op.data, "text");
      if (typeof op.data.class === "string") {
        requireEnum(op.data.class, CLAIM_CLASSES, "claim class");
      }
      return;
    }
    case "event": {
      if (op.op !== "create") throw new Error("event only supports create");
      requireString(op.data, "entityId");
      requireString(op.data, "when");
      requireString(op.data, "what");
      return;
    }
    case "question": {
      if (op.op !== "create") throw new Error("question only supports create");
      requireString(op.data, "entityId");
      requireString(op.data, "text");
      return;
    }
    case "entity": {
      if (op.op === "create" || op.op === "upsert") {
        requireEnum(
          requireString(op.data, "kind"),
          ENTITY_KINDS,
          "entity kind"
        );
        requireString(op.data, "name");
        requireString(op.data, "slug");
        return;
      }
      if (op.op === "update") return;
      throw new Error(`entity does not support op: ${JSON.stringify(op.op)}`);
    }
    case "identifier": {
      if (op.op !== "create" && op.op !== "upsert") {
        throw new Error("identifier supports create/upsert");
      }
      requireString(op.data, "entityId");
      requireEnum(
        requireString(op.data, "type"),
        IDENTIFIER_TYPES,
        "identifier type"
      );
      requireString(op.data, "value");
      if (typeof op.data.status === "string") {
        requireEnum(op.data.status, IDENTIFIER_STATUSES, "identifier status");
      }
      return;
    }
    case "edge": {
      if (op.op !== "create" && op.op !== "upsert") {
        throw new Error("edge supports create/upsert");
      }
      requireString(op.data, "fromId");
      requireString(op.data, "toId");
      const predicate = requireEnum(
        requireString(op.data, "predicate"),
        EDGE_PREDICATES,
        "edge predicate"
      );
      const notes = typeof op.data.notes === "string" ? op.data.notes : null;
      if (
        predicate === "related_to" &&
        (notes === null || notes.trim() === "")
      ) {
        throw new Error("related_to requires notes");
      }
      return;
    }
    default: {
      const _exhaustive: never = op.resource;
      throw new Error(`Unhandled resource: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/**
 * Shape-only validation (resource/op/required fields). No confidence gate —
 * use for propose (no confidence yet) and before applyPatch's full gates.
 */
export function assertPatchShape(patch: PatchOp[]): void {
  for (const op of patch) {
    assertOpShape(op);
  }
}

/**
 * Pure Accept policies — no DB. Call before applying PatchOps so machines and
 * UI can fail closed without a Postgres round-trip.
 */
export function assertPatchGates(
  patch: PatchOp[],
  opts: PatchGateOpts = {}
): void {
  if (patchNeedsConfidence(patch) && !opts.confidence) {
    throw new Error("confidence is required for this Proposal");
  }
  if (opts.confidence === "confirmed") {
    const anyEvidence = patch.some((op) => (op.evidenceIds?.length ?? 0) > 0);
    const shared = (opts.sharedEvidenceIds?.length ?? 0) > 0;
    if (!anyEvidence && !shared) {
      throw new Error("confirmed requires at least one Evidence attachment");
    }
  }

  assertPatchShape(patch);
}
