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

function textWithQuote(text: string, evidenceQuote?: string): string {
  if (evidenceQuote !== undefined && evidenceQuote !== "") {
    return `${text} (“${evidenceQuote}”)`;
  }
  return text;
}

function identifierNotes(
  notes: string | undefined,
  evidenceQuote: string | undefined
): string {
  return [notes, evidenceQuote ? `quote: ${evidenceQuote}` : null]
    .filter(Boolean)
    .join(" | ");
}

function identifierToPatchOp(
  id: ProcessExtractDraft["identifiers"][number],
  entityId: string,
  evidenceIds: string[]
): PatchOp {
  const notesParts = identifierNotes(id.notes, id.evidenceQuote);
  const platform = normalizeIdentifierPlatform(id.platform ?? "");
  const value = normalizeIdentifierValue(id.type, id.value);
  return {
    op: "create",
    resource: "identifier",
    id: randomUUID(),
    evidenceIds,
    data: {
      entityId,
      type: id.type,
      value,
      platform,
      ...(id.status ? { status: id.status } : {}),
      ...(notesParts ? { notes: notesParts } : {}),
    },
  };
}

function claimToPatchOp(
  claim: ProcessExtractDraft["claims"][number],
  entityId: string,
  evidenceIds: string[]
): PatchOp {
  return {
    op: "create",
    resource: "claim",
    id: randomUUID(),
    evidenceIds,
    data: {
      entityId,
      text: textWithQuote(claim.text, claim.evidenceQuote),
      class: claim.class ?? "observation",
    },
  };
}

function questionToPatchOp(
  question: ProcessExtractDraft["questions"][number],
  entityId: string,
  evidenceIds: string[]
): PatchOp {
  return {
    op: "create",
    resource: "question",
    id: randomUUID(),
    evidenceIds,
    data: {
      entityId,
      text: textWithQuote(question.text, question.evidenceQuote),
    },
  };
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
  const entityId = ctx.entityId;
  return [
    ...draft.identifiers.map((id) =>
      identifierToPatchOp(id, entityId, evidenceIds)
    ),
    ...draft.claims.map((claim) =>
      claimToPatchOp(claim, entityId, evidenceIds)
    ),
    ...draft.questions.map((q) => questionToPatchOp(q, entityId, evidenceIds)),
  ];
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
