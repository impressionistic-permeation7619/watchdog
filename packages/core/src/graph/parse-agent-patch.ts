import { assertPatchShape } from "@watchdog/policy";
import { trimmedOrNull, type PatchOp } from "@watchdog/schemas";

import { tryParsePatch } from "./patch";

export interface ParsedAgentPatch {
  ok: true;
  patch: PatchOp[];
  summary: string | null;
  evidenceIds: string[];
}

export interface AgentPatchRefusal {
  ok: false;
  error: string;
}

/**
 * Pure parse + shape + non-empty for agent propose / graph write.
 * Write-only rules (userOverride, forced unverified) live at the call site.
 */
export function parseAgentPatch(input: {
  patch: unknown;
  summary?: string;
  evidenceIds?: string[];
}): ParsedAgentPatch | AgentPatchRefusal {
  const parsed = tryParsePatch(input.patch);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  try {
    assertPatchShape(parsed.patch);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid patch shape",
    };
  }

  if (parsed.patch.length === 0) {
    return { ok: false, error: "patch must not be empty" };
  }

  return {
    ok: true,
    patch: parsed.patch,
    summary: trimmedOrNull(input.summary),
    evidenceIds: [...new Set(input.evidenceIds)],
  };
}
