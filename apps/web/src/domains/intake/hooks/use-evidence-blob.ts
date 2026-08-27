import { useQuery } from "@tanstack/react-query";

import { evidenceDownloadUrlQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import { artifactContentQuery } from "@/domains/jobs/queries";

function isTextMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return (
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("html") ||
    mime.includes("yaml") ||
    mime.includes("javascript")
  );
}

function evidenceNeedsBlobText(evidence: EvidenceRecord | null): boolean {
  if (!evidence) return false;
  if (evidence.text !== null && evidence.text !== "") return false;
  if (evidence.uri === null || evidence.uri === "") return false;
  return isTextMime(evidence.mime);
}

export function useEvidenceBlob(
  caseId: string,
  evidence: EvidenceRecord | null
) {
  const needsBlobText = evidenceNeedsBlobText(evidence);

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

  const isImage = evidence?.mime?.startsWith("image/") ?? false;
  const downloadUrl = downloadQuery.data?.url ?? null;
  const loadingUrl = downloadQuery.isPending;
  const resolvedText =
    evidence?.text ?? (needsBlobText ? (blobQuery.data?.text ?? null) : null);
  const loadingBlob = needsBlobText && blobQuery.isPending;

  return {
    isImage,
    downloadUrl,
    loadingUrl,
    resolvedText,
    loadingBlob,
    hasUri: Boolean(evidence?.uri),
  };
}
