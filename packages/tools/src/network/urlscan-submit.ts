import { z } from "zod";

import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { isRecord } from "../parse/coerce";

export const urlscanSubmitVisibilitySchema = z.enum([
  "public",
  "unlisted",
  "private",
]);

export const urlscanSubmitSnapshotSchema = z.object({
  url: z.string().min(1),
  visibility: urlscanSubmitVisibilitySchema,
  queriedAt: z.string().min(1),
  source: z.literal("urlscan.io"),
  uuid: z.string().nullable(),
  resultUrl: z.string().nullable(),
  apiUrl: z.string().nullable(),
  message: z.string().nullable(),
  accepted: z.boolean(),
});

export type UrlscanSubmitVisibility = z.infer<
  typeof urlscanSubmitVisibilitySchema
>;
export type UrlscanSubmitSnapshot = z.infer<typeof urlscanSubmitSnapshotSchema>;

/**
 * Submit a URL for a live urlscan.io browser scan.
 * POST https://urlscan.io/api/v1/scan/
 * @see https://urlscan.io/docs/api/
 */
export async function submitUrlscan(
  url: string,
  apiKey: string,
  visibility: UrlscanSubmitVisibility,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<UrlscanSubmitSnapshot> {
  const key = apiKey.trim();
  if (!key) throw missingApiKey("URLSCAN_API_KEY");
  const target = url.trim();
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.urlscan.submit; OSINT)";

  const res = await fetch("https://urlscan.io/api/v1/scan/", {
    method: "POST",
    signal,
    headers: {
      "API-Key": key,
      "Content-Type": "application/json",
      "User-Agent": ua,
    },
    body: JSON.stringify({ url: target, visibility }),
  });

  if (res.status === 429) {
    throw rateLimitedToolsError("URLScan", target);
  }
  if (res.status >= 400) {
    throw httpToolsError(
      "URLScan API",
      res.status,
      `URLScan API ${res.status} for ${target}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("URLScan submit", target);
  }
  const uuid =
    typeof body.uuid === "string" && body.uuid !== "" ? body.uuid : null;

  return urlscanSubmitSnapshotSchema.parse({
    url: target,
    visibility,
    queriedAt: new Date().toISOString(),
    source: "urlscan.io",
    uuid,
    resultUrl: typeof body.result === "string" ? body.result : null,
    apiUrl: typeof body.api === "string" ? body.api : null,
    message: typeof body.message === "string" ? body.message : null,
    accepted: uuid !== null,
  });
}
