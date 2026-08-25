export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseCaseList(json: unknown): { id: string; name: string }[] {
  if (!Array.isArray(json)) throw new Error("cases response was not an array");
  return json.map((row, index) => {
    if (
      !isRecord(row) ||
      typeof row.id !== "string" ||
      typeof row.name !== "string"
    ) {
      throw new Error(`cases[${index}] missing id/name`);
    }
    return { id: row.id, name: row.name };
  });
}

export function parseEntity(json: unknown): { id: string; name: string } {
  if (
    !isRecord(json) ||
    typeof json.id !== "string" ||
    typeof json.name !== "string"
  ) {
    throw new Error("entity response missing id/name");
  }
  return { id: json.id, name: json.name };
}

export function parseEntityId(json: unknown): { id: string } {
  if (!isRecord(json) || typeof json.id !== "string") {
    throw new Error("entity response missing id");
  }
  return { id: json.id };
}

export function parseEvidenceList(json: unknown): { id: string }[] {
  if (!Array.isArray(json)) {
    throw new TypeError("evidence response was not an array");
  }
  return json.map((row, index) => {
    if (!isRecord(row) || typeof row.id !== "string") {
      throw new Error(`evidence[${index}] missing id`);
    }
    return { id: row.id };
  });
}

export const e2eApiParsers = {
  caseList: parseCaseList,
  entity: parseEntity,
  entityId: parseEntityId,
  evidenceList: parseEvidenceList,
};
