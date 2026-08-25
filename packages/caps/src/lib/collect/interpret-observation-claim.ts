import { randomUUID } from "node:crypto";

import type { CapInterpretResult } from "@watchdog/cap-sdk";

/**
 * Shared Collect interpret: attach a single observation Claim when entityId is set.
 * Cap-local `summarize()` builds `text` / empty summary — keep those outside.
 */
export function interpretObservationClaim(opts: {
  entityId: string | undefined;
  text: string;
  noEntitySummary: string;
}): CapInterpretResult {
  if (opts.entityId === undefined || opts.entityId === "") {
    return { patch: [], summary: opts.noEntitySummary };
  }
  return {
    summary: opts.text,
    patch: [
      {
        op: "create",
        resource: "claim",
        id: randomUUID(),
        data: {
          entityId: opts.entityId,
          text: opts.text,
          class: "observation",
        },
      },
    ],
  };
}
