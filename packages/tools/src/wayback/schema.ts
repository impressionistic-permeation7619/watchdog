import { z } from "zod";

export const waybackCdxRowSchema = z.object({
  timestamp: z.string(),
  original: z.string(),
  statuscode: z.string().optional(),
  mimetype: z.string().optional(),
  digest: z.string().optional(),
});

export const waybackLookupSnapshotSchema = z.object({
  url: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("web.archive.org/cdx"),
  rows: z.array(waybackCdxRowSchema),
  closestTimestamp: z.string().nullable(),
});

export type WaybackCdxRow = z.infer<typeof waybackCdxRowSchema>;
export type WaybackLookupSnapshot = z.infer<typeof waybackLookupSnapshotSchema>;

export const waybackFetchSnapshotSchema = z.object({
  url: z.string().min(1),
  timestamp: z.string().min(1),
  archiveUrl: z.string().min(1),
  queriedAt: z.string().min(1),
  status: z.number(),
  ok: z.boolean(),
  contentType: z.string().nullable(),
  bodyPreview: z.string(),
  byteLength: z.number(),
  error: z.string().optional(),
});

export type WaybackFetchSnapshot = z.infer<typeof waybackFetchSnapshotSchema>;
