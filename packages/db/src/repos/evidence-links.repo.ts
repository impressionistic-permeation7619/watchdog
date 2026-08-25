import { eq, inArray } from "drizzle-orm";

import { normalizeIdList } from "@watchdog/schemas";

import type { DbExec } from "../exec";
import {
  claimEvidence,
  edgeEvidence,
  identifierEvidence,
} from "../schema/evidence-links";

function groupByParent(
  rows: { parentId: string; evidenceId: string }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.parentId) ?? [];
    list.push(row.evidenceId);
    map.set(row.parentId, list);
  }
  return map;
}

export const evidenceLinksRepo = {
  async listForClaims(
    exec: DbExec,
    claimIds: string[]
  ): Promise<Map<string, string[]>> {
    if (claimIds.length === 0) return new Map();
    const rows = await exec
      .select({
        parentId: claimEvidence.claimId,
        evidenceId: claimEvidence.evidenceId,
      })
      .from(claimEvidence)
      .where(inArray(claimEvidence.claimId, claimIds));
    return groupByParent(rows);
  },

  async listForIdentifiers(
    exec: DbExec,
    identifierIds: string[]
  ): Promise<Map<string, string[]>> {
    if (identifierIds.length === 0) return new Map();
    const rows = await exec
      .select({
        parentId: identifierEvidence.identifierId,
        evidenceId: identifierEvidence.evidenceId,
      })
      .from(identifierEvidence)
      .where(inArray(identifierEvidence.identifierId, identifierIds));
    return groupByParent(rows);
  },

  async listForEdges(
    exec: DbExec,
    edgeIds: string[]
  ): Promise<Map<string, string[]>> {
    if (edgeIds.length === 0) return new Map();
    const rows = await exec
      .select({
        parentId: edgeEvidence.edgeId,
        evidenceId: edgeEvidence.evidenceId,
      })
      .from(edgeEvidence)
      .where(inArray(edgeEvidence.edgeId, edgeIds));
    return groupByParent(rows);
  },

  async linkClaim(
    exec: DbExec,
    claimId: string,
    evidenceIds: string[]
  ): Promise<void> {
    const unique = normalizeIdList(evidenceIds);
    if (unique.length === 0) return;
    await exec
      .insert(claimEvidence)
      .values(unique.map((evidenceId) => ({ claimId, evidenceId })));
  },

  async replaceClaim(
    exec: DbExec,
    claimId: string,
    evidenceIds: string[]
  ): Promise<string[]> {
    const unique = normalizeIdList(evidenceIds);
    await exec.delete(claimEvidence).where(eq(claimEvidence.claimId, claimId));
    if (unique.length > 0) {
      await exec
        .insert(claimEvidence)
        .values(unique.map((evidenceId) => ({ claimId, evidenceId })));
    }
    return unique;
  },

  async linkIdentifier(
    exec: DbExec,
    identifierId: string,
    evidenceIds: string[]
  ): Promise<void> {
    const unique = normalizeIdList(evidenceIds);
    if (unique.length === 0) return;
    await exec
      .insert(identifierEvidence)
      .values(unique.map((evidenceId) => ({ identifierId, evidenceId })));
  },

  async replaceIdentifier(
    exec: DbExec,
    identifierId: string,
    evidenceIds: string[]
  ): Promise<string[]> {
    const unique = normalizeIdList(evidenceIds);
    await exec
      .delete(identifierEvidence)
      .where(eq(identifierEvidence.identifierId, identifierId));
    if (unique.length > 0) {
      await exec
        .insert(identifierEvidence)
        .values(unique.map((evidenceId) => ({ identifierId, evidenceId })));
    }
    return unique;
  },

  async linkEdge(
    exec: DbExec,
    edgeId: string,
    evidenceIds: string[]
  ): Promise<void> {
    const unique = normalizeIdList(evidenceIds);
    if (unique.length === 0) return;
    await exec
      .insert(edgeEvidence)
      .values(unique.map((evidenceId) => ({ edgeId, evidenceId })));
  },

  async replaceEdge(
    exec: DbExec,
    edgeId: string,
    evidenceIds: string[]
  ): Promise<string[]> {
    const unique = normalizeIdList(evidenceIds);
    await exec.delete(edgeEvidence).where(eq(edgeEvidence.edgeId, edgeId));
    if (unique.length > 0) {
      await exec
        .insert(edgeEvidence)
        .values(unique.map((evidenceId) => ({ edgeId, evidenceId })));
    }
    return unique;
  },
};
