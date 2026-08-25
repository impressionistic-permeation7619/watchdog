import { z } from "zod";

import type { JsonObject } from "./json";
import { jsonObjectSchema, uuidSchema } from "./primitives";

/** Graph patch op (confidence is chosen at Accept, never in data). */
export interface PatchOp {
  op: "create" | "upsert" | "update";
  resource: "entity" | "identifier" | "edge" | "claim" | "event" | "question";
  id: string;
  data: JsonObject;
  evidenceIds?: string[];
}

const resourceSchema = z.enum([
  "entity",
  "identifier",
  "edge",
  "claim",
  "event",
  "question",
]);

/** Resources where confidence is chosen at Accept — never in op.data. */
const CONFIDENCE_GATED_RESOURCES = new Set(["claim", "identifier", "edge"]);

export const patchOpSchema = z
  .object({
    op: z.enum(["create", "upsert", "update"]),
    resource: resourceSchema,
    id: uuidSchema,
    data: jsonObjectSchema,
    evidenceIds: z.array(uuidSchema).optional(),
  })
  .superRefine((op, ctx) => {
    if (
      CONFIDENCE_GATED_RESOURCES.has(op.resource) &&
      "confidence" in op.data
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "op.data.confidence is forbidden — confidence is chosen at Inbox Accept",
        path: ["data", "confidence"],
      });
    }
  });

export const patchSchema = z.array(patchOpSchema);

export function patchOpEntityId(op: PatchOp): string | undefined {
  const value = op.data.entityId;
  return typeof value === "string" ? value : undefined;
}

export function patchOpText(op: PatchOp): string | undefined {
  const value = op.data.text;
  return typeof value === "string" ? value : undefined;
}
