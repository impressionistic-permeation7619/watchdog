import { z } from "zod";

import { slugifyName } from "@/lib/utils";
import {
  entityKindSchema,
  nonEmptyTrimmed,
  trimmedOrUndefined,
  uuidSchema,
  type EntityKind,
} from "@watchdog/schemas";

export interface EntityRecord {
  id: string;
  caseId: string;
  kind: EntityKind;
  name: string;
  slug: string;
  summary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const caseIdInputSchema = z.object({
  caseId: uuidSchema,
});
export type CaseIdInput = z.output<typeof caseIdInputSchema>;

export const caseSlugInputSchema = z.object({
  caseId: uuidSchema,
  slug: nonEmptyTrimmed,
});
export type CaseSlugInput = z.output<typeof caseSlugInputSchema>;

export const createEntityInputSchema = z
  .object({
    caseId: uuidSchema,
    kind: entityKindSchema,
    name: nonEmptyTrimmed,
    slug: z.string().optional(),
  })
  .transform((data) => {
    const slug = (
      trimmedOrUndefined(data.slug) ?? slugifyName(data.name)
    ).trim();
    return {
      caseId: data.caseId,
      kind: data.kind,
      name: data.name,
      slug,
    };
  })
  .refine((data) => data.slug.length > 0, {
    message: "Slug is required",
    path: ["slug"],
  });
export type CreateEntityInput = z.output<typeof createEntityInputSchema>;

export const updateEntityFieldsInputSchema = z
  .object({
    caseId: uuidSchema,
    entityId: uuidSchema,
    kind: entityKindSchema.optional(),
    name: nonEmptyTrimmed.optional(),
    summary: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.kind !== undefined ||
      data.name !== undefined ||
      data.summary !== undefined ||
      data.notes !== undefined,
    {
      message: "Nothing to update",
    }
  );
export type UpdateEntityFieldsInput = z.output<
  typeof updateEntityFieldsInputSchema
>;
