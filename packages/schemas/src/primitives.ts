import { z } from "zod";

import type { JsonValue } from "./json";

export const uuidSchema = z.uuid();

export const nonEmptyTrimmed = z.string().trim().min(1);

/** Trim; empty / whitespace → undefined (optional field absent). */
export function trimmedOrUndefined(
  value: string | null | undefined
): string | undefined {
  const t = value?.trim();
  return t === undefined || t === "" ? undefined : t;
}

/** Trim; empty / whitespace → null. */
export function trimmedOrNull(value: string | null | undefined): string | null {
  return trimmedOrUndefined(value) ?? null;
}

/** Optional string that collapses blank / whitespace to absent. */
export const optionalTrimmedSchema = z
  .string()
  .optional()
  .transform((value) => trimmedOrUndefined(value));

/** Case / entity slug from a display name (lowercase, kebab, max 64). */
export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .slice(0, 64);
}

export const sha256HexSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, { error: "Expected 64-char lowercase hex SHA-256" });

/** Max Intake / Evidence file upload size (presign + PUT + confirm). */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const httpUrlSchema = z.url().refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { error: "URL must be http or https" }
);

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
);

export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);

/** Trim, drop empties, dedupe — shared by core services and link repos. */
export function normalizeIdList(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export const uuidListSchema = z
  .array(z.string())
  .transform((ids) => normalizeIdList(ids).map((id) => uuidSchema.parse(id)));
