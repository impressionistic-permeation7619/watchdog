import { asc, eq, ilike, or } from "drizzle-orm";

import type { DbExec } from "../exec";
import { cases } from "../schema/cases";
import { containsPattern } from "./_ilike";

export const caseColumns = {
  id: cases.id,
  name: cases.name,
  slug: cases.slug,
  description: cases.description,
  allowThirdPartyEgress: cases.allowThirdPartyEgress,
} as const;

export type CaseRow = {
  [K in keyof typeof caseColumns]: (typeof cases.$inferSelect)[K &
    keyof typeof cases.$inferSelect];
};

export type NewCase = Pick<
  typeof cases.$inferInsert,
  "name" | "slug" | "description"
>;

export type CasePatch = Partial<
  Pick<
    typeof cases.$inferInsert,
    "name" | "slug" | "description" | "allowThirdPartyEgress"
  >
>;

export const casesRepo = {
  async list(exec: DbExec): Promise<CaseRow[]> {
    return exec.select(caseColumns).from(cases).orderBy(asc(cases.name));
  },

  async search(exec: DbExec, term: string, limit: number): Promise<CaseRow[]> {
    const pattern = containsPattern(term);
    if (pattern === null) return [];
    return exec
      .select(caseColumns)
      .from(cases)
      .where(
        or(
          ilike(cases.name, pattern),
          ilike(cases.slug, pattern),
          ilike(cases.description, pattern)
        )
      )
      .orderBy(asc(cases.name))
      .limit(limit);
  },

  async getById(exec: DbExec, id: string): Promise<CaseRow | null> {
    const [row] = await exec
      .select(caseColumns)
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1);
    return row ?? null;
  },

  async getBySlug(exec: DbExec, slug: string): Promise<CaseRow | null> {
    const [row] = await exec
      .select(caseColumns)
      .from(cases)
      .where(eq(cases.slug, slug))
      .limit(1);
    return row ?? null;
  },

  async create(exec: DbExec, values: NewCase): Promise<CaseRow | null> {
    const [created] = await exec
      .insert(cases)
      .values(values)
      .returning(caseColumns);
    return created ?? null;
  },

  async update(
    exec: DbExec,
    id: string,
    patch: CasePatch
  ): Promise<CaseRow | null> {
    const [updated] = await exec
      .update(cases)
      .set(patch)
      .where(eq(cases.id, id))
      .returning(caseColumns);
    return updated ?? null;
  },

  async delete(exec: DbExec, id: string): Promise<CaseRow | null> {
    const [deleted] = await exec
      .delete(cases)
      .where(eq(cases.id, id))
      .returning(caseColumns);
    return deleted ?? null;
  },
};
