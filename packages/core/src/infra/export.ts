/**
 * export.ts — Render an Entity (and its full graph data) as an Obsidian-style
 * markdown note matching the locked Export format from the greenfield plan.
 *
 * Note anatomy:
 *   YAML frontmatter → Connections → Identifiers → Summary → Claims →
 *   Timeline → Questions → Notes → Evidence
 */

import {
  casesRepo,
  claimsRepo,
  db,
  edgesRepo,
  entitiesRepo,
  eventsRepo,
  evidenceRepo,
  identifiersRepo,
  questionsRepo,
  type EvidenceRow,
  type EntityPeerRow,
} from "@watchdog/db";
import type { EntityKind } from "@watchdog/schemas";

import {
  appendClaimsSection,
  appendConnectionsSection,
  appendEvidenceSection,
  appendIdentifiersSection,
  appendOptionalTextSection,
  appendQuestionsSection,
  appendTimelineSection,
  buildAttestationsMarkdown,
  buildCaseMarkdown,
  buildEntityFrontmatter,
  isAttestationExportRow,
} from "./export-sections";

export interface EntityExport {
  caseSlug: string;
  entitySlug: string;
  kind: EntityKind;
  markdown: string;
}

/**
 * Fetch all data for an entity and render it as a markdown note.
 * Pass `peerMap` when exporting a whole Case to avoid re-scanning peers.
 */
export async function renderEntityMarkdown(
  entityId: string,
  peerMap?: Map<string, EntityPeerRow>
): Promise<EntityExport | null> {
  const row = await entitiesRepo.getWithCase(db, entityId);
  if (!row) return null;

  const [
    entityClaims,
    entityIdentifiers,
    outEdges,
    entityEvents,
    entityQuestions,
    entityEvidence,
    peers,
  ] = await Promise.all([
    claimsRepo.listForEntity(db, entityId),
    identifiersRepo.listForEntity(db, entityId),
    edgesRepo.listOutboundForEntity(db, entityId),
    eventsRepo.listForEntity(db, entityId),
    questionsRepo.listForEntity(db, entityId),
    evidenceRepo.listForEntity(db, row.caseId, entityId),
    peerMap
      ? Promise.resolve([] as EntityPeerRow[])
      : entitiesRepo.listPeersForCase(db, row.caseId),
  ]);

  const resolvedPeers =
    peerMap ?? new Map(peers.map((e) => [e.id, e] as const));

  const lines: string[] = [
    buildEntityFrontmatter({
      kind: row.kind,
      caseSlug: row.caseSlug,
      entityId: row.id,
    }),
    `# ${row.name}`,
    "",
  ];

  appendConnectionsSection(lines, outEdges, resolvedPeers);
  appendIdentifiersSection(lines, entityIdentifiers);
  appendOptionalTextSection(lines, "## Summary", row.summary);
  appendClaimsSection(lines, entityClaims);
  appendTimelineSection(lines, entityEvents);
  appendQuestionsSection(lines, entityQuestions);
  appendOptionalTextSection(lines, "## Notes", row.notes);
  appendEvidenceSection(lines, entityEvidence);

  return {
    caseSlug: row.caseSlug,
    entitySlug: row.slug,
    kind: row.kind,
    markdown: `${lines.join("\n").trimEnd()}\n`,
  };
}

interface CaseExportResult {
  files: Map<string, string>;
  evidenceRows: EvidenceRow[];
}

/**
 * Render all entities in a Case and return them as a map of
 * `kind/slug` → markdown string.
 * Also includes evidence file references in CASE.md.
 */
export async function renderCaseExport(
  caseId: string
): Promise<CaseExportResult> {
  const entityRows = await entitiesRepo.listPeersForCase(db, caseId);
  const peerMap = new Map(entityRows.map((e) => [e.id, e]));
  const mdFiles = new Map<string, string>();

  const exportedEntities = await Promise.all(
    entityRows.map(async ({ id }) => renderEntityMarkdown(id, peerMap))
  );
  for (const exported of exportedEntities) {
    if (exported) {
      mdFiles.set(
        `${exported.kind}s/${exported.entitySlug}.md`,
        exported.markdown
      );
    }
  }

  const evidenceRows = await evidenceRepo.listActiveForCaseAsc(db, caseId);
  const caseRow = await casesRepo.getById(db, caseId);

  if (caseRow) {
    const attestations = evidenceRows.filter(isAttestationExportRow);

    mdFiles.set(
      "CASE.md",
      buildCaseMarkdown(caseRow, mdFiles, evidenceRows.length)
    );

    if (attestations.length > 0) {
      mdFiles.set(
        "evidence/attestations.md",
        buildAttestationsMarkdown(caseRow.slug, attestations)
      );
    }
  }

  return { files: mdFiles, evidenceRows };
}
