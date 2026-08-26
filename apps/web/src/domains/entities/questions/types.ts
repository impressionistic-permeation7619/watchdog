import { z } from "zod";

import {
  nonEmptyTrimmed,
  optionalTrimmedSchema,
  trimmedOrNull,
  uuidSchema,
} from "@watchdog/schemas";

import type { QuestionRecord as CoreQuestionRecord } from "@watchdog/core";

export type QuestionRecord = CoreQuestionRecord;

export const entityScopeInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
});
export type EntityScopeInput = z.output<typeof entityScopeInputSchema>;

export const createQuestionInputSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema,
  text: nonEmptyTrimmed,
});
export type CreateQuestionInput = z.output<typeof createQuestionInputSchema>;

export const resolveQuestionInputSchema = z.object({
  caseId: uuidSchema,
  questionId: uuidSchema,
  resolvedNote: optionalTrimmedSchema,
});
export type ResolveQuestionInput = z.output<typeof resolveQuestionInputSchema>;

export const questionScopeInputSchema = z.object({
  caseId: uuidSchema,
  questionId: uuidSchema,
});
export type QuestionScopeInput = z.output<typeof questionScopeInputSchema>;

export const updateQuestionInputSchema = z.object({
  caseId: uuidSchema,
  questionId: uuidSchema,
  text: nonEmptyTrimmed.optional(),
  resolvedNote: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : trimmedOrNull(value)
    ),
});
export type UpdateQuestionInput = z.output<typeof updateQuestionInputSchema>;
