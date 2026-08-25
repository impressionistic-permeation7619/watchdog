import { z } from "zod";

import {
  claimClassSchema,
  IDENTIFIER_PLATFORM_SLUGS,
  identifierStatusSchema,
  identifierTypeSchema,
} from "@watchdog/schemas";

const PLATFORM_HINT = IDENTIFIER_PLATFORM_SLUGS.join(", ");

const draftIdentifierSchema = z.object({
  type: identifierTypeSchema.describe("Identifier type from closed vocab"),
  value: z.string().trim().min(1).describe("Raw identifier value"),
  /**
   * Prefer a known slug when it matches Evidence; custom lowercase slug OK if not in catalog.
   * Free string — not a closed enum.
   */
  platform: z
    .string()
    .trim()
    .optional()
    .describe(
      `Platform slug for handles (and optionally email/crypto). Prefer known: ${PLATFORM_HINT}. Custom slug allowed if the site is not listed.`
    ),
  status: identifierStatusSchema
    .optional()
    .describe("current | former | unknown — only when Evidence states it"),
  notes: z.string().optional(),
  evidenceQuote: z
    .string()
    .optional()
    .describe("Verbatim span from EvidenceSnapshot.text when possible"),
});

const draftClaimSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1)
    .describe("Observation text grounded in Evidence"),
  class: claimClassSchema.optional().describe("Default observation"),
  evidenceQuote: z.string().optional(),
});

const draftQuestionSchema = z.object({
  text: z.string().trim().min(1).describe("Open question when uncertain"),
  evidenceQuote: z.string().optional(),
});

/**
 * Semantic extract — NO confidence, NO Graph resource ids from model/harvest.
 * Harvest and AI Process Caps both emit this shape.
 */
export const processExtractDraftSchema = z.object({
  summary: z
    .string()
    .optional()
    .describe("Short extract summary for Job/Proposal"),
  identifiers: z.array(draftIdentifierSchema).default([]),
  claims: z.array(draftClaimSchema).default([]),
  questions: z.array(draftQuestionSchema).default([]),
});

export type ProcessExtractDraft = z.infer<typeof processExtractDraftSchema>;

export function isEmptyDraft(draft: ProcessExtractDraft): boolean {
  return (
    draft.identifiers.length === 0 &&
    draft.claims.length === 0 &&
    draft.questions.length === 0
  );
}
