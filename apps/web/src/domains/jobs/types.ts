import { z } from "zod";

import {
  jsonObjectSchema,
  nonEmptyTrimmed,
  uuidSchema,
  type JsonObject,
  type JsonValue,
  type PlaybookSeedKind,
} from "@watchdog/schemas";

/** CapDescriptor wire shape from capabilities.list (serializable catalog). */
export interface CapListItem {
  id: string;
  version: string;
  title: string;
  description?: string;
  dataSource?: string;
  kind?: string;
  flags?: string[];
  egress: string;
  consumes?: {
    kind: string;
    type?: string;
    evidenceKind?: string;
  }[];
  produces?: {
    kind: string;
    type?: string;
    evidenceKind?: string;
  }[];
  useCases?: string[];
  credentials?: ({ name: string; optional?: boolean } | { anyOf: string[] })[];
  timeoutMs?: number;
  jobPolicy?: {
    needsEvidenceSnapshot?: boolean;
    linkEvidenceFromInput?: ("evidenceId" | "sourceEvidenceId")[];
    markEvidenceProcessed?: boolean;
    cacheTtlMs?: number;
  };
  input: JsonObject;
  inputForm: JsonObject;
}

export function inputFormProperties(
  inputForm: JsonObject | undefined
): Record<string, JsonValue> | undefined {
  const props = inputForm?.properties;
  if (typeof props !== "object" || props === null || Array.isArray(props)) {
    return undefined;
  }
  return props;
}

export const listJobsInputSchema = z.object({
  caseId: uuidSchema,
});
export type ListJobsInput = z.output<typeof listJobsInputSchema>;

export const getJobInputSchema = z.object({
  caseId: uuidSchema,
  jobId: uuidSchema,
});
export type GetJobInput = z.output<typeof getJobInputSchema>;

export const startJobInputSchema = z.object({
  caseId: uuidSchema,
  capabilityId: nonEmptyTrimmed,
  input: jsonObjectSchema.default({}),
});
export type StartJobInput = z.output<typeof startJobInputSchema>;

export const cancelJobInputSchema = z.object({
  caseId: uuidSchema,
  jobId: uuidSchema,
});
export type CancelJobInput = z.output<typeof cancelJobInputSchema>;

/** PlaybookDescriptor wire shape from capabilities.listPlaybooks. */
export interface PlaybookListItem {
  id: string;
  title: string;
  description: string;
  seedKinds: PlaybookSeedKind[];
  steps: string[];
  requires: {
    credentials: ({ name: string; optional?: boolean } | { anyOf: string[] })[];
    egress: string;
    flags: string[];
  };
}

export const startPlaybookInputSchema = z.object({
  caseId: uuidSchema,
  playbookId: nonEmptyTrimmed,
  seed: z.object({
    host: z.string().optional(),
    url: z.string().optional(),
    evidenceId: uuidSchema.optional(),
    entityId: uuidSchema.optional(),
    ip: z.string().optional(),
    email: z.string().optional(),
    hash: z.string().optional(),
    handle: z.string().optional(),
  }),
});
export type StartPlaybookInput = z.output<typeof startPlaybookInputSchema>;

export const cancelPlaybookInputSchema = z.object({
  caseId: uuidSchema,
  playbookRunId: uuidSchema,
});
export type CancelPlaybookInput = z.output<typeof cancelPlaybookInputSchema>;

const artifactMimeSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "");

/** Resolve blob keys server-side — never accept client-supplied storage URIs. */
export const getArtifactContentInputSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("job"),
    caseId: uuidSchema,
    jobId: uuidSchema,
    sha256: nonEmptyTrimmed,
    mime: artifactMimeSchema,
  }),
  z.object({
    source: z.literal("evidence"),
    caseId: uuidSchema,
    evidenceId: uuidSchema,
    mime: artifactMimeSchema,
  }),
]);
export type GetArtifactContentInput = z.output<
  typeof getArtifactContentInputSchema
>;
