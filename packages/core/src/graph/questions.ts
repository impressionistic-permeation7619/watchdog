import {
  questionsRepo,
  db,
  type DbExec,
  type QuestionRow,
} from "@watchdog/db";
import type { EntityKind, QuestionStatus } from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";
import { notifyEntityChanged } from "../infra/events";
import { assertEntityInCase } from "./patch/guards";

export interface QuestionRecord {
  id: string;
  entityId: string;
  text: string;
  status: QuestionStatus;
  resolvedNote: string | null;
}

export interface CreateQuestionInput {
  caseId: string;
  entityId: string;
  text: string;
}

export interface ResolveQuestionInput {
  caseId: string;
  questionId: string;
  resolvedNote?: string;
}

export interface UpdateQuestionInput {
  caseId: string;
  questionId: string;
  text?: string;
  resolvedNote?: string | null;
}

export interface ReopenQuestionInput {
  caseId: string;
  questionId: string;
}

const DEFAULT_QUESTIONS: Partial<Record<EntityKind, readonly string[]>> = {
  person: [
    "What do they do for work?",
    "When did this identity start, and is it current?",
    "What other handles / accounts?",
    "Any emails, phones, or URLs?",
    "What in that is externally searchable?",
  ],
};

interface SeedQuestionEntity { id: string; kind: EntityKind }

export async function seedDefaultQuestions(
  tx: DbExec,
  row: SeedQuestionEntity
): Promise<void> {
  const texts = DEFAULT_QUESTIONS[row.kind];
  if (!texts) return;
  const seeded = await Promise.all(
    texts.map(async (text) =>
      questionsRepo.create(tx, {
        entityId: row.id,
        text,
        status: "open",
      })
    )
  );
  if (seeded.some((question) => question === null)) {
    throw new DomainError("invalid", `Failed to seed ${row.kind} Questions`);
  }
}

function toRecord(row: QuestionRow): QuestionRecord {
  return {
    id: row.id,
    entityId: row.entityId,
    text: row.text,
    status: row.status,
    resolvedNote: row.resolvedNote ?? null,
  };
}

export async function listQuestionsForEntity(
  caseId: string,
  entityId: string
): Promise<QuestionRecord[]> {
  await assertEntityInCase(caseId, entityId, db);
  const rows = await questionsRepo.listForEntity(db, entityId);
  return rows.map(toRecord);
}

export async function createQuestion(
  input: CreateQuestionInput
): Promise<QuestionRecord> {
  await assertEntityInCase(input.caseId, input.entityId, db);
  const row = await questionsRepo.create(db, {
    entityId: input.entityId,
    text: input.text,
    status: "open",
  });
  if (!row) throw new DomainError("invalid", "Failed to create Question");
  notifyEntityChanged(input.caseId);
  return toRecord(row);
}

export async function resolveQuestion(
  input: ResolveQuestionInput
): Promise<QuestionRecord> {
  const existing = await questionsRepo.getInCase(
    db,
    input.caseId,
    input.questionId
  );
  if (!existing) throw new DomainError("not_found", "Question not found");
  if (existing.status === "resolved") {
    throw new DomainError("conflict", "Question already resolved");
  }

  const row = await questionsRepo.resolve(db, input.questionId, {
    resolvedNote: input.resolvedNote ?? null,
  });
  if (!row) throw new DomainError("invalid", "Failed to resolve Question");
  notifyEntityChanged(input.caseId);
  return toRecord(row);
}

export async function updateQuestion(
  input: UpdateQuestionInput
): Promise<QuestionRecord> {
  const existing = await questionsRepo.getInCase(
    db,
    input.caseId,
    input.questionId
  );
  if (!existing) throw new DomainError("not_found", "Question not found");

  if (input.text === undefined && input.resolvedNote === undefined) {
    throw new DomainError("invalid", "Nothing to update");
  }
  if (input.resolvedNote !== undefined && existing.status !== "resolved") {
    throw new DomainError(
      "invalid",
      "Resolved note only applies to resolved Questions"
    );
  }

  const row = await questionsRepo.update(db, input.questionId, {
    ...(input.text === undefined ? {} : { text: input.text }),
    ...(input.resolvedNote === undefined
      ? {}
      : { resolvedNote: input.resolvedNote }),
  });
  if (!row) throw new DomainError("invalid", "Failed to update Question");
  notifyEntityChanged(input.caseId);
  return toRecord(row);
}

export async function reopenQuestion(
  input: ReopenQuestionInput
): Promise<QuestionRecord> {
  const existing = await questionsRepo.getInCase(
    db,
    input.caseId,
    input.questionId
  );
  if (!existing) throw new DomainError("not_found", "Question not found");
  if (existing.status === "open") {
    throw new DomainError("conflict", "Question is already open");
  }

  const row = await questionsRepo.update(db, input.questionId, {
    status: "open",
    resolvedNote: null,
  });
  if (!row) throw new DomainError("invalid", "Failed to reopen Question");
  notifyEntityChanged(input.caseId);
  return toRecord(row);
}
