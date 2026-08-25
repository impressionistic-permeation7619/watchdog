import {
  confirmFileUploadFn,
  presignUploadFn,
} from "@/domains/intake/intake.functions";
import type { EvidenceRecord } from "@/domains/intake/types";
import { MAX_UPLOAD_BYTES } from "@watchdog/schemas";

async function sha256HexFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadFileEvidence(input: {
  caseId: string;
  file: File;
  label?: string;
  entityId?: string;
}): Promise<EvidenceRecord> {
  if (input.file.size < 1) throw new Error("File is empty");
  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds ${MAX_UPLOAD_BYTES} byte limit`);
  }

  const mime = input.file.type || "application/octet-stream";
  const sha256 = await sha256HexFile(input.file);
  const put = await presignUploadFn({
    data: {
      caseId: input.caseId,
      sha256,
      mime,
      byteLength: input.file.size,
      name: input.file.name,
    },
  });

  const res = await fetch(put.url, {
    method: "PUT",
    headers: put.headers,
    body: input.file,
  });
  if (!res.ok) {
    throw new Error(`MinIO upload failed (${res.status})`);
  }

  return confirmFileUploadFn({
    data: {
      caseId: input.caseId,
      uri: put.uri,
      sha256: put.sha256,
      mime: put.mime,
      byteLength: put.byteLength,
      label: input.label,
      entityId: input.entityId,
    },
  });
}
