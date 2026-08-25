import { z } from "zod";

import type {
  CaseEdgeRecord as CoreCaseEdgeRecord,
  EdgeRecord as CoreEdgeRecord,
} from "@watchdog/core";
import {
  confidenceTierSchema,
  edgePredicateSchema,
  optionalTrimmedSchema,
  uuidListSchema,
  uuidSchema,
} from "@watchdog/schemas";

export type EdgeRecord = CoreEdgeRecord;
export type CaseEdgeRecord = CoreCaseEdgeRecord;

export const entityScopeInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
});
export type EntityScopeInput = z.output<typeof entityScopeInputSchema>;

export const caseScopeInputSchema = z.object({
  caseId: uuidSchema,
});
export type CaseScopeInput = z.output<typeof caseScopeInputSchema>;

export const createEdgeInputSchema = z.object({
  caseId: uuidSchema,
  fromId: uuidSchema,
  toId: uuidSchema,
  predicate: edgePredicateSchema,
  confidence: confidenceTierSchema,
  notes: optionalTrimmedSchema,
  evidenceIds: uuidListSchema.optional(),
  viewEntityId: uuidSchema.optional(),
});
export type CreateEdgeInput = z.output<typeof createEdgeInputSchema>;

export const edgeScopeInputSchema = z.object({
  caseId: uuidSchema,
  edgeId: uuidSchema,
});
export type EdgeScopeInput = z.output<typeof edgeScopeInputSchema>;

export const updateEdgeInputSchema = z
  .object({
    caseId: uuidSchema,
    edgeId: uuidSchema,
    entityId: uuidSchema,
    fromId: uuidSchema.optional(),
    toId: uuidSchema.optional(),
    predicate: edgePredicateSchema.optional(),
    confidence: confidenceTierSchema.optional(),
    notes: z.string().optional(),
    evidenceIds: uuidListSchema.optional(),
  })
  .refine(
    (v) =>
      (v.fromId === undefined && v.toId === undefined) ||
      (v.fromId !== undefined && v.toId !== undefined),
    { message: "fromId and toId must be sent together" }
  );
export type UpdateEdgeInput = z.output<typeof updateEdgeInputSchema>;
