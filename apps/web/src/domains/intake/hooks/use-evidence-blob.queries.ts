import { useQuery } from "@tanstack/react-query";

import { evidenceDownloadUrlQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import { artifactContentQuery } from "@/domains/jobs/queries";

const TEXT_MIME_PATTERN =
  /^(text\/|.*json.*|.*xml.*|.*html.*|.*yaml.*|.*javascript.*)/;

function isTextMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return TEXT_MIME_PATTERN.test(mime);
}

export function evidenceNeedsBlobText(
  evidence: EvidenceRecord | null
): boolean {
  if (!evidence) return false;
  if (evidence.text !== null && evidence.text !== "") return false;
  if (evidence.uri === null || evidence.uri === "") return false;
  return isTextMime(evidence.mime);
}

export function buildEvidenceBlobState(input: {
  evidence: EvidenceRecord | null;
  needsBlobText: boolean;
  downloadUrl: string | null;
  loadingUrl: boolean;
  blobText: string | null;
  loadingBlob: boolean;
}) {
  return {
    isImage: input.evidence?.mime?.startsWith("image/") ?? false,
    downloadUrl: input.downloadUrl,
    loadingUrl: input.loadingUrl,
    resolvedText:
      input.evidence?.text ??
      (input.needsBlobText ? input.blobText : null),
    loadingBlob: input.loadingBlob,
    hasUri: Boolean(input.evidence?.uri),
  };
}

export function useEvidenceBlobQueries(
  caseId: string,
  evidence: EvidenceRecord | null,
  needsBlobText: boolean
) {
  const downloadQuery = useQuery({
    ...evidenceDownloadUrlQuery(caseId, evidence?.id ?? ""),
    enabled: Boolean(evidence?.id && evidence.uri),
  });

  const blobQuery = useQuery({
    ...artifactContentQuery({
      source: "evidence",
      caseId,
      evidenceId: evidence?.id ?? "",
      mime: evidence?.mime ?? "text/plain",
    }),
    enabled: needsBlobText,
  });

  return { downloadQuery, blobQuery };
}
