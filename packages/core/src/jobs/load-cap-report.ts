import {
  parseJsonValue,
  REPORT_JSON_ARTIFACT,
  type JsonValue,
} from "@watchdog/schemas";

interface ArtifactRef {
  name: string;
  uri: string;
}

/** True if artifacts include canonical Cap report. */
export function artifactsHaveCapReport(artifacts: ArtifactRef[]): boolean {
  return artifacts.some((a) => a.name === REPORT_JSON_ARTIFACT);
}

/**
 * Load Cap report JSON for pure interpret.
 * Requires canonical `report.json`.
 */
export async function loadCapReport(
  artifacts: ArtifactRef[],
  readArtifact: (uri: string) => Promise<Uint8Array>
): Promise<{ report: JsonValue; name: string } | null> {
  const art = artifacts.find((a) => a.name === REPORT_JSON_ARTIFACT);
  if (!art) return null;
  const bytes = await readArtifact(art.uri);
  const text = new TextDecoder().decode(bytes);
  return { report: parseJsonValue(text), name: art.name };
}
