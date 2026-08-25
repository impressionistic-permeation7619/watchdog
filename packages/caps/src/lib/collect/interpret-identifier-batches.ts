import { randomUUID } from "node:crypto";

import type { CapInterpretResult } from "@watchdog/cap-sdk";
import {
  validateIdentifierValue,
  type IdentifierType,
} from "@watchdog/schemas";

export interface IdentifierBatch {
  type: IdentifierType;
  values: readonly (string | null | undefined)[];
  platform?: string;
  /** Max Identifier ops for this batch (default 40). */
  limit?: number;
}

/**
 * Propose one or more typed Identifier batches + a single observation Claim.
 */
export function interpretIdentifierBatches(opts: {
  entityId: string | undefined;
  batches: readonly IdentifierBatch[];
  claimText: string;
  noEntitySummary: string;
}): CapInterpretResult {
  if (opts.entityId === undefined || opts.entityId === "") {
    return { patch: [], summary: opts.noEntitySummary };
  }

  const entityId = opts.entityId;
  const patch: CapInterpretResult["patch"] = [];

  for (const batch of opts.batches) {
    const limit = batch.limit ?? 40;
    const seen = new Set<string>();
    let added = 0;
    for (const raw of batch.values) {
      if (raw === null || raw === undefined || raw === "") continue;
      const parsed = validateIdentifierValue(batch.type, raw);
      if (!parsed.ok || seen.has(parsed.value)) continue;
      seen.add(parsed.value);
      const { value } = parsed;
      patch.push({
        op: "create",
        resource: "identifier",
        id: randomUUID(),
        data: {
          entityId,
          type: batch.type,
          value,
          ...(batch.platform !== undefined && batch.platform !== ""
            ? { platform: batch.platform }
            : {}),
        },
      });
      added += 1;
      if (added >= limit) break;
    }
  }

  if (opts.claimText.trim() !== "") {
    patch.push({
      op: "create",
      resource: "claim",
      id: randomUUID(),
      data: {
        entityId,
        text: opts.claimText,
        class: "observation",
      },
    });
  }

  return {
    summary: opts.claimText,
    patch,
  };
}

/** Single-type Identifier batch — thin wrapper over `interpretIdentifierBatches`. */
export function interpretTypedIdentifiers(opts: {
  entityId: string | undefined;
  type: IdentifierType;
  values: string[];
  claimText: string;
  noEntitySummary: string;
  platform?: string;
  limit?: number;
}): CapInterpretResult {
  const { type, values, platform, limit, ...rest } = opts;
  return interpretIdentifierBatches({
    ...rest,
    batches: [{ type, values, platform, limit }],
  });
}
