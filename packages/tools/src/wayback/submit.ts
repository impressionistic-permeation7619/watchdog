import {
  archiveSubmitSnapshotSchema,
  type ArchiveSubmitSnapshot,
} from "./submit-schema";

export {
  archiveSubmitSnapshotSchema,
  archiveSubmitResultSchema,
  type ArchiveSubmitSnapshot,
  type ArchiveSubmitResult,
} from "./submit-schema";

function ensureHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Push a URL to Wayback Save Page Now.
 * Creates a public archive record — Cap must declare third_party egress.
 */
export async function submitWaybackSave(
  url: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<ArchiveSubmitSnapshot> {
  const target = ensureHttpUrl(url);
  const saveUrl = `https://web.archive.org/save/${target}`;
  const ua = options?.userAgent ?? "Watchdog/1.0 (+archive.url.submit; OSINT)";

  let status: number | null = null;
  let archiveUrl: string | null = null;
  let detail: string | null = null;
  let accepted = false;

  try {
    const res = await fetch(saveUrl, {
      method: "GET",
      redirect: "follow",
      signal,
      headers: { "User-Agent": ua, Accept: "*/*" },
    });
    status = res.status;
    const contentLoc =
      res.headers.get("content-location") ?? res.headers.get("location");
    if (contentLoc !== null && contentLoc.includes("web.archive.org/web/")) {
      archiveUrl = contentLoc;
    } else if (res.url.includes("web.archive.org/web/")) {
      archiveUrl = res.url;
    } else {
      archiveUrl = `https://web.archive.org/web/*/${encodeURI(target)}`;
    }
    accepted = res.status < 500;
    detail = `HTTP ${res.status}`;
  } catch (error) {
    accepted = false;
    detail = error instanceof Error ? error.message : String(error);
  }

  return archiveSubmitSnapshotSchema.parse({
    url: target,
    queriedAt: new Date().toISOString(),
    results: [
      {
        service: "wayback",
        accepted,
        archiveUrl,
        detail,
        status,
      },
    ],
  });
}
