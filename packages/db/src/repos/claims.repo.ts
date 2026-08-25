import { and, asc, eq, inArray } from "drizzle-orm";

import type { DbExec } from "../exec";
import { claims } from "../schema/claims";
import { entities } from "../schema/entities";

export const claimColumns = {
  id: claims.id,
  entityId: claims.entityId,
  class: claims.class,
  text: claims.text,
  confidence: claims.confidence,
  retracted: claims.retracted,
  retractKind: claims.retractKind,
  retractedReason: claims.retractedReason,
  retractedBy: claims.retractedBy,
  retractedAt: claims.retractedAt,
} as const;

export type ClaimRow = {
  [K in keyof typeof claimColumns]: (typeof claims.$inferSelect)[K &
    keyof typeof claims.$inferSelect];
};

export type NewClaim = Pick<
  typeof claims.$inferInsert,
  "entityId" | "text" | "confidence" | "class"
> &
  Partial<Pick<typeof claims.$inferInsert, "id">>;

export type ClaimPatch = Partial<
  Pick<typeof claims.$inferInsert, "text" | "class" | "confidence">
>;

export interface RetractClaimValues {
  retractKind: NonNullable<(typeof claims.$inferSelect)["retractKind"]>;
  retractedReason: string;
  retractedBy: string;
}

export interface ClaimTextKey {
  entityId: string;
  text: string;
}

export const claimsRepo = {
  async listForEntity(
    exec: DbExec,
    entityId: string,
    opts?: { includeRetracted?: boolean }
  ): Promise<ClaimRow[]> {
    return exec
      .select(claimColumns)
      .from(claims)
      .where(
        and(
          eq(claims.entityId, entityId),
          opts?.includeRetracted === true
            ? undefined
            : eq(claims.retracted, false)
        )
      )
      .orderBy(asc(claims.createdAt));
  },

  async getInCase(
    exec: DbExec,
    caseId: string,
    claimId: string
  ): Promise<ClaimRow | null> {
    const [row] = await exec
      .select(claimColumns)
      .from(claims)
      .innerJoin(entities, eq(claims.entityId, entities.id))
      .where(and(eq(claims.id, claimId), eq(entities.caseId, caseId)))
      .limit(1);
    return row ?? null;
  },

  /** Active claim text keys for FP suppress — scoped to case + entity ids. */
  async listTextKeysInCase(
    exec: DbExec,
    caseId: string,
    entityIds: string[]
  ): Promise<ClaimTextKey[]> {
    if (entityIds.length === 0) return [];
    return exec
      .select({ entityId: claims.entityId, text: claims.text })
      .from(claims)
      .innerJoin(entities, eq(claims.entityId, entities.id))
      .where(
        and(
          eq(entities.caseId, caseId),
          inArray(claims.entityId, entityIds),
          eq(claims.retracted, false)
        )
      );
  },

  async create(exec: DbExec, values: NewClaim): Promise<ClaimRow | null> {
    const [created] = await exec
      .insert(claims)
      .values(values)
      .returning(claimColumns);
    return created ?? null;
  },

  async update(
    exec: DbExec,
    claimId: string,
    patch: ClaimPatch
  ): Promise<ClaimRow | null> {
    const [updated] = await exec
      .update(claims)
      .set(patch)
      .where(eq(claims.id, claimId))
      .returning(claimColumns);
    return updated ?? null;
  },

  async retract(
    exec: DbExec,
    claimId: string,
    values: RetractClaimValues
  ): Promise<ClaimRow | null> {
    const [row] = await exec
      .update(claims)
      .set({
        retracted: true,
        retractKind: values.retractKind,
        retractedReason: values.retractedReason,
        retractedBy: values.retractedBy,
        retractedAt: new Date(),
      })
      .where(eq(claims.id, claimId))
      .returning(claimColumns);
    return row ?? null;
  },
};
