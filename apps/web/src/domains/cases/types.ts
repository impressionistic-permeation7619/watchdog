import { z } from "zod";

import { slugifyName } from "@/lib/utils";
import {
  nonEmptyTrimmed,
  optionalTrimmedSchema,
  trimmedOrUndefined,
  uuidSchema,
} from "@watchdog/schemas";

import type { CaseRecord as CoreCaseRecord } from "@watchdog/core";

export type CaseRecord = CoreCaseRecord;

/** Cases list + healed active Case (cookie). */
export interface CasesContext {
  cases: CaseRecord[];
  active: CaseRecord | null;
}

export const setActiveCaseIdInputSchema = z.object({
  caseId: z
    .union([uuidSchema, z.literal(""), z.null()])
    .transform((value) => (value === "" || value === null ? null : value)),
});
export type SetActiveCaseIdInput = z.output<typeof setActiveCaseIdInputSchema>;

export const createCaseInputSchema = z
  .object({
    name: nonEmptyTrimmed,
    slug: z.string().optional(),
    description: optionalTrimmedSchema,
  })
  .transform((data) => {
    const slug = (
      trimmedOrUndefined(data.slug) ?? slugifyName(data.name)
    ).trim();
    return {
      name: data.name,
      slug,
      description: data.description,
    };
  })
  .refine((data) => data.slug.length > 0, {
    message: "Slug is required",
    path: ["slug"],
  });
export type CreateCaseInput = z.input<typeof createCaseInputSchema>;

export const updateCaseInputSchema = z.object({
  id: uuidSchema,
  name: optionalTrimmedSchema,
  description: optionalTrimmedSchema,
  allowThirdPartyEgress: z.boolean().optional(),
});
export type UpdateCaseInput = z.output<typeof updateCaseInputSchema>;

export const deleteCaseInputSchema = z.object({
  id: uuidSchema,
});
export type DeleteCaseInput = z.output<typeof deleteCaseInputSchema>;
