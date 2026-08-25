import type { CapArtifact } from "@watchdog/cap-sdk";
import { REPORT_JSON_ARTIFACT } from "@watchdog/schemas";

type UploadFn = (input: {
  bytes: Uint8Array;
  mime: string;
  name?: string;
}) => Promise<CapArtifact>;

/** Upload report.json + a named JSON artifact with identical body (Collect Caps). */
export async function uploadJsonReportPair(
  uploadArtifact: UploadFn,
  snap: unknown,
  namedArtifactName: string
): Promise<{ report: CapArtifact; artifact: CapArtifact }> {
  const body = new TextEncoder().encode(JSON.stringify(snap, null, 2));
  const report = await uploadArtifact({
    bytes: body,
    mime: "application/json",
    name: REPORT_JSON_ARTIFACT,
  });
  const artifact = await uploadArtifact({
    bytes: body,
    mime: "application/json",
    name: namedArtifactName,
  });
  return { report, artifact };
}
