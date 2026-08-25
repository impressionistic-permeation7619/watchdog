import { and, eq, inArray } from "drizzle-orm";

import type { DbExec } from "../exec";
import { findingSuppressions } from "../schema/finding-suppressions";

export type FindingSuppressionRow = typeof findingSuppressions.$inferSelect;

export interface NewFindingSuppression {
  caseId: string;
  fingerprint: string;
  reason: string;
  proposalId: string;
}

export const findingSuppressionsRepo = {
  async listFingerprints(
    exec: DbExec,
    caseId: string,
    fingerprints: string[]
  ): Promise<string[]> {
    if (fingerprints.length === 0) return [];
    const rows = await exec
      .select({ fingerprint: findingSuppressions.fingerprint })
      .from(findingSuppressions)
      .where(
        and(
          eq(findingSuppressions.caseId, caseId),
          inArray(findingSuppressions.fingerprint, fingerprints)
        )
      );
    return rows.map((r) => r.fingerprint);
  },

  async insertMany(exec: DbExec, rows: NewFindingSuppression[]): Promise<void> {
    if (rows.length === 0) return;
    await exec.insert(findingSuppressions).values(rows).onConflictDoNothing();
  },
};
