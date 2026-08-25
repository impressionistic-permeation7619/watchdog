import { and, asc, eq, inArray } from "drizzle-orm";

import type { DbExec } from "../exec";
import { entities } from "../schema/entities";
import { questions } from "../schema/questions";

export const questionColumns = {
  id: questions.id,
  entityId: questions.entityId,
  text: questions.text,
  status: questions.status,
  resolvedNote: questions.resolvedNote,
} as const;

export type QuestionRow = {
  [K in keyof typeof questionColumns]: (typeof questions.$inferSelect)[K &
    keyof typeof questions.$inferSelect];
};

export type NewQuestion = Pick<
  typeof questions.$inferInsert,
  "entityId" | "text" | "status"
> &
  Partial<Pick<typeof questions.$inferInsert, "id">>;

export type QuestionPatch = Partial<
  Pick<typeof questions.$inferInsert, "text" | "status" | "resolvedNote">
>;

export interface ResolveQuestionValues {
  resolvedNote: string | null;
}

export interface QuestionTextKey {
  entityId: string;
  text: string;
}

export const questionsRepo = {
  async listForEntity(exec: DbExec, entityId: string): Promise<QuestionRow[]> {
    return exec
      .select(questionColumns)
      .from(questions)
      .where(eq(questions.entityId, entityId))
      .orderBy(asc(questions.createdAt));
  },

  async getInCase(
    exec: DbExec,
    caseId: string,
    questionId: string
  ): Promise<QuestionRow | null> {
    const [row] = await exec
      .select(questionColumns)
      .from(questions)
      .innerJoin(entities, eq(questions.entityId, entities.id))
      .where(and(eq(questions.id, questionId), eq(entities.caseId, caseId)))
      .limit(1);
    return row ?? null;
  },

  /** Text keys for FP suppress — scoped to case + entity ids. */
  async listTextKeysInCase(
    exec: DbExec,
    caseId: string,
    entityIds: string[]
  ): Promise<QuestionTextKey[]> {
    if (entityIds.length === 0) return [];
    return exec
      .select({ entityId: questions.entityId, text: questions.text })
      .from(questions)
      .innerJoin(entities, eq(questions.entityId, entities.id))
      .where(
        and(eq(entities.caseId, caseId), inArray(questions.entityId, entityIds))
      );
  },

  async create(exec: DbExec, values: NewQuestion): Promise<QuestionRow | null> {
    const [created] = await exec
      .insert(questions)
      .values(values)
      .returning(questionColumns);
    return created ?? null;
  },

  async update(
    exec: DbExec,
    questionId: string,
    patch: QuestionPatch
  ): Promise<QuestionRow | null> {
    const [updated] = await exec
      .update(questions)
      .set(patch)
      .where(eq(questions.id, questionId))
      .returning(questionColumns);
    return updated ?? null;
  },

  async resolve(
    exec: DbExec,
    questionId: string,
    values: ResolveQuestionValues
  ): Promise<QuestionRow | null> {
    const [row] = await exec
      .update(questions)
      .set({ status: "resolved", resolvedNote: values.resolvedNote })
      .where(eq(questions.id, questionId))
      .returning(questionColumns);
    return row ?? null;
  },
};
