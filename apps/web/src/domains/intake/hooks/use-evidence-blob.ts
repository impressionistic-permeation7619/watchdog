import type { EvidenceRecord } from "@/domains/intake/types";

import {
  buildEvidenceBlobState,
  evidenceNeedsBlobText,
  useEvidenceBlobQueries,
} from "./use-evidence-blob.queries";

export function useEvidenceBlob(
  caseId: string,
  evidence: EvidenceRecord | null
) {
  const needsBlobText = evidenceNeedsBlobText(evidence);
  const { downloadQuery, blobQuery } = useEvidenceBlobQueries(
    caseId,
    evidence,
    needsBlobText
  );

  return buildEvidenceBlobState({
    evidence,
    needsBlobText,
    downloadUrl: downloadQuery.data?.url ?? null,
    loadingUrl: downloadQuery.isPending,
    blobText: blobQuery.data?.text ?? null,
    loadingBlob: needsBlobText && blobQuery.isPending,
  });
}
