import { z } from "zod";

import type { ClaimRecord as CoreClaimRecord } from "@watchdog/core";
import {
  claimClassSchema,
  confidenceTierSchema,
  nonEmptyTrimmed,
  retractKindSchema,
  uuidListSchema,
  uuidSchema,
} from "@watchdog/schemas";

export type ClaimRecord = CoreClaimRecord;

export const listClaimsInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
  includeRetracted: z.boolean().optional().default(false),
});
export type ListClaimsInput = z.output<typeof listClaimsInputSchema>;

export const createClaimInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
  text: nonEmptyTrimmed,
  confidence: confidenceTierSchema,
  class: claimClassSchema.default("observation"),
  evidenceIds: uuidListSchema.optional(),
});
/** Wire / form payload (class optional before default). */
export type CreateClaimInput = z.input<typeof createClaimInputSchema>;
/** After validator parse (class always present). */
export type CreateClaimParsed = z.output<typeof createClaimInputSchema>;

export const retractClaimInputSchema = z.object({
  caseId: uuidSchema,
  claimId: uuidSchema,
  kind: retractKindSchema,
  reason: nonEmptyTrimmed,
});
export type RetractClaimInput = z.output<typeof retractClaimInputSchema>;

export const updateClaimInputSchema = z.object({
  caseId: uuidSchema,
  claimId: uuidSchema,
  text: nonEmptyTrimmed.optional(),
  class: claimClassSchema.optional(),
  confidence: confidenceTierSchema.optional(),
  evidenceIds: uuidListSchema.optional(),
});
export type UpdateClaimInput = z.output<typeof updateClaimInputSchema>;
