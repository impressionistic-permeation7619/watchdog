import { and, desc, eq, ilike } from "drizzle-orm";

import type { PatchOp, ProposalStatus } from "@watchdog/schemas";

import type { DbExec } from "../exec";
import { jobs } from "../schema/jobs";
import { proposals } from "../schema/proposals";
import { containsPattern } from "./_ilike";

export type ProposalRow = typeof proposals.$inferSelect;

export interface ProposalWithCapability {
  proposal: ProposalRow;
  capabilityId: string | null;
}

export type NewProposal = Pick<
  typeof proposals.$inferInsert,
  "caseId" | "status" | "patch"
> &
  Partial<
    Pick<
      typeof proposals.$inferInsert,
      | "jobId"
      | "summary"
      | "suppressedCount"
      | "evidenceIds"
      | "agentSourced"
      | "userOverridden"
      | "createdBy"
    >
  >;

export const proposalsRepo = {
  async listForCase(
    exec: DbExec,
    caseId: string,
    opts?: { status?: ProposalStatus }
  ): Promise<ProposalWithCapability[]> {
    const rows = await exec
      .select({
        proposal: proposals,
        capabilityId: jobs.capabilityId,
      })
      .from(proposals)
      .leftJoin(jobs, eq(proposals.jobId, jobs.id))
      .where(
        and(
          eq(proposals.caseId, caseId),
          opts?.status ? eq(proposals.status, opts.status) : undefined
        )
      )
      .orderBy(desc(proposals.createdAt));
    return rows.map((r) => ({
      proposal: r.proposal,
      capabilityId: r.capabilityId ?? null,
    }));
  },

  /** Pending proposals whose summary matches term. */
  async searchPendingForCase(
    exec: DbExec,
    caseId: string,
    term: string,
    limit: number
  ): Promise<ProposalWithCapability[]> {
    const pattern = containsPattern(term);
    if (pattern === null) return [];
    const rows = await exec
      .select({
        proposal: proposals,
        capabilityId: jobs.capabilityId,
      })
      .from(proposals)
      .leftJoin(jobs, eq(proposals.jobId, jobs.id))
      .where(
        and(
          eq(proposals.caseId, caseId),
          eq(proposals.status, "pending"),
          ilike(proposals.summary, pattern)
        )
      )
      .orderBy(desc(proposals.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      proposal: r.proposal,
      capabilityId: r.capabilityId ?? null,
    }));
  },

  async getInCase(
    exec: DbExec,
    caseId: string,
    proposalId: string
  ): Promise<ProposalWithCapability | null> {
    const [row] = await exec
      .select({
        proposal: proposals,
        capabilityId: jobs.capabilityId,
      })
      .from(proposals)
      .leftJoin(jobs, eq(proposals.jobId, jobs.id))
      .where(and(eq(proposals.caseId, caseId), eq(proposals.id, proposalId)))
      .limit(1);
    if (!row) return null;
    return {
      proposal: row.proposal,
      capabilityId: row.capabilityId ?? null,
    };
  },

  /** Row lock for Accept/Reject — joins none so FOR UPDATE is not on a nullable side. */
  async lockInCase(
    exec: DbExec,
    caseId: string,
    proposalId: string
  ): Promise<ProposalRow | null> {
    const [row] = await exec
      .select()
      .from(proposals)
      .where(and(eq(proposals.caseId, caseId), eq(proposals.id, proposalId)))
      .limit(1)
      .for("update");
    return row ?? null;
  },

  async listPendingPatches(
    exec: DbExec,
    caseId: string
  ): Promise<{ patch: PatchOp[] }[]> {
    return exec
      .select({ patch: proposals.patch })
      .from(proposals)
      .where(
        and(eq(proposals.caseId, caseId), eq(proposals.status, "pending"))
      );
  },

  async create(
    exec: DbExec,
    values: NewProposal
  ): Promise<{ id: string } | null> {
    const [created] = await exec
      .insert(proposals)
      .values({
        ...values,
        evidenceIds: values.evidenceIds ?? [],
        agentSourced: values.agentSourced ?? false,
        userOverridden: values.userOverridden ?? false,
      })
      .returning({ id: proposals.id });
    return created ?? null;
  },

  async accept(
    exec: DbExec,
    proposalId: string,
    values: { decidedBy: string; decidedAt: Date }
  ): Promise<ProposalRow | null> {
    const [updated] = await exec
      .update(proposals)
      .set({
        status: "accepted",
        decidedBy: values.decidedBy,
        decidedAt: values.decidedAt,
      })
      .where(and(eq(proposals.id, proposalId), eq(proposals.status, "pending")))
      .returning();
    return updated ?? null;
  },

  async reject(
    exec: DbExec,
    caseId: string,
    proposalId: string,
    values: {
      rejectReason: string | null;
      decidedBy: string;
      decidedAt: Date;
    }
  ): Promise<ProposalRow | null> {
    const [updated] = await exec
      .update(proposals)
      .set({
        status: "rejected",
        rejectReason: values.rejectReason,
        decidedBy: values.decidedBy,
        decidedAt: values.decidedAt,
      })
      .where(
        and(
          eq(proposals.id, proposalId),
          eq(proposals.caseId, caseId),
          eq(proposals.status, "pending")
        )
      )
      .returning();
    return updated ?? null;
  },
};
