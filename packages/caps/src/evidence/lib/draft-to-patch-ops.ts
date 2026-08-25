import { randomUUID } from "node:crypto";

import { isEmptyDraft, type ProcessExtractDraft } from "@watchdog/ai";
import {
  normalizeIdentifierPlatform,
  normalizeIdentifierValue,
  trimmedOrUndefined,
  type PatchOp,
} from "@watchdog/schemas";

export interface DraftToPatchOpsCtx {
  evidenceId: string;
  entityId?: string;
}

/**
 * Pure mapper: ProcessExtractDraft → PatchOp[].
 * Strips any smuggled confidence; attaches source evidenceId.
 * Without entityId, returns [] (identifiers/claims/questions need a parent Entity).
 */
export function draftToPatchOps(
  draft: ProcessExtractDraft,
  ctx: DraftToPatchOpsCtx
): PatchOp[] {
  if (isEmptyDraft(draft)) return [];
  if (ctx.entityId === undefined || ctx.entityId === "") return [];

  const evidenceIds = [ctx.evidenceId];
  const patch: PatchOp[] = [];

  for (const id of draft.identifiers) {
    const notesParts = [
      id.notes,
      id.evidenceQuote !== undefined && id.evidenceQuote !== ""
        ? `quote: ${id.evidenceQuote}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");
    const platform = normalizeIdentifierPlatform(id.platform ?? "");
    const value = normalizeIdentifierValue(id.type, id.value);
    patch.push({
      op: "create",
      resource: "identifier",
      id: randomUUID(),
      evidenceIds,
      data: {
        entityId: ctx.entityId,
        type: id.type,
        value,
        platform,
        ...(id.status ? { status: id.status } : {}),
        ...(notesParts ? { notes: notesParts } : {}),
      },
    });
  }

  for (const claim of draft.claims) {
    const text =
      claim.evidenceQuote !== undefined && claim.evidenceQuote !== ""
        ? `${claim.text} (“${claim.evidenceQuote}”)`
        : claim.text;
    patch.push({
      op: "create",
      resource: "claim",
      id: randomUUID(),
      evidenceIds,
      data: {
        entityId: ctx.entityId,
        text,
        class: claim.class ?? "observation",
      },
    });
  }

  for (const q of draft.questions) {
    const text =
      q.evidenceQuote !== undefined && q.evidenceQuote !== ""
        ? `${q.text} (“${q.evidenceQuote}”)`
        : q.text;
    patch.push({
      op: "create",
      resource: "question",
      id: randomUUID(),
      evidenceIds,
      data: {
        entityId: ctx.entityId,
        text,
      },
    });
  }

  return patch;
}

export type ProcessCapOutcome =
  | { kind: "empty"; reason: "no_signal" | "no_entity" }
  | { kind: "proposal"; patch: PatchOp[]; summary: string }
  | { kind: "failed"; error: string };

export function draftToOutcome(
  draft: ProcessExtractDraft,
  ctx: DraftToPatchOpsCtx
): ProcessCapOutcome {
  if (isEmptyDraft(draft)) {
    return { kind: "empty", reason: "no_signal" };
  }
  if (ctx.entityId === undefined || ctx.entityId === "") {
    return { kind: "empty", reason: "no_entity" };
  }
  const patch = draftToPatchOps(draft, ctx);
  if (patch.length === 0) {
    return { kind: "empty", reason: "no_signal" };
  }
  const summary =
    trimmedOrUndefined(draft.summary) ??
    `Process extract: ${draft.identifiers.length} id(s), ${draft.claims.length} claim(s), ${draft.questions.length} question(s)`;
  return { kind: "proposal", patch, summary };
}
