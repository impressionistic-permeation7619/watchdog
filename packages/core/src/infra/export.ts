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

export interface EntityExport {
  caseSlug: string;
  entitySlug: string;
  kind: EntityKind;
  markdown: string;
}

function yamlLine(
  key: string,
  value: string | null | undefined
): string | null {
  if (value === null || value === undefined || value === "") return null;
  return `${key}: ${value}`;
}

function qLabel(i: number): string {
  return `Q${String(i + 1).padStart(2, "0")}`;
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

  const frontmatter = [
    "---",
    yamlLine("tags", `[${row.kind}]`),
    yamlLine("case", row.caseSlug),
    yamlLine("entity_id", row.id),
    yamlLine("last_exported", new Date().toISOString()),
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const lines: string[] = [frontmatter, `# ${row.name}`, ""];

  if (outEdges.length > 0) {
    lines.push("## Connections");
    for (const edge of outEdges) {
      const peer = resolvedPeers.get(edge.toId);
      if (peer) {
        const notesSuffix =
          edge.notes !== null && edge.notes !== ""
            ? ` <!-- ${edge.notes} -->`
            : "";
        lines.push(`${edge.predicate}:: [[${peer.slug}]]${notesSuffix}`);
      }
    }
    lines.push("");
  }

  if (entityIdentifiers.length > 0) {
    lines.push(
      "## Identifiers",
      "| Type | Platform | Value | Status | Confidence |",
      "|------|----------|-------|--------|------------|"
    );
    for (const id of entityIdentifiers) {
      const platform = id.platform || "—";
      lines.push(
        `| ${id.type} | ${platform} | ${id.value} | ${id.status} | ${id.confidence} |`
      );
    }
    lines.push("");
  }

  if (row.summary !== null && row.summary.trim() !== "") {
    lines.push("## Summary", row.summary.trim(), "");
  }

  if (entityClaims.length > 0) {
    lines.push("## Claims");
    for (const [i, claim] of entityClaims.entries()) {
      lines.push(`${i + 1}. **${claim.text}** — ${claim.confidence}`);
    }
    lines.push("");
  }

  if (entityEvents.length > 0) {
    lines.push("## Timeline");
    for (const ev of entityEvents) {
      const where =
        ev.whereText !== null && ev.whereText !== ""
          ? ` @ ${ev.whereText}`
          : "";
      lines.push(`- ${ev.when} · ${ev.what}${where}`);
    }
    lines.push("");
  }

  if (entityQuestions.length > 0) {
    lines.push("## Questions");
    const open = entityQuestions.filter((q) => q.status === "open");
    const resolved = entityQuestions.filter((q) => q.status === "resolved");

    for (const [i, q] of open.entries()) {
      lines.push(`- ${qLabel(i)} ${q.text} — open`);
    }
    for (const [i, q] of resolved.entries()) {
      const note =
        q.resolvedNote !== null && q.resolvedNote !== ""
          ? ` → ${q.resolvedNote}`
          : "";
      lines.push(`- ${qLabel(open.length + i)} ~~${q.text}~~${note}`);
    }
    lines.push("");
  }

  if (row.notes !== null && row.notes.trim() !== "") {
    lines.push("## Notes", row.notes.trim(), "");
  }

  if (entityEvidence.length > 0) {
    lines.push("## Evidence");
    for (const ev of entityEvidence) {
      const label = ev.label ?? ev.sourceUrl ?? ev.uri ?? ev.id.slice(0, 8);
      lines.push(`- ${ev.id.slice(0, 8)} · ${ev.kind} · ${label}`);
    }
    lines.push("");
  }

  return {
    caseSlug: row.caseSlug,
    entitySlug: row.slug,
    kind: row.kind,
    markdown: `${lines.join("\n").trimEnd()}\n`,
  };
}

/**
 * Render all entities in a Case and return them as a map of
 * `kind/slug` → markdown string.
 * Also includes evidence file references in CASE.md.
 */
export async function renderCaseExport(caseId: string): Promise<{
  files: Map<string, string>;
  evidenceRows: EvidenceRow[];
}> {
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
    const attestations = evidenceRows.filter(
      (e) =>
        e.kind === "attestation" &&
        (e.uri === null || e.uri === "") &&
        e.text !== null &&
        e.text !== ""
    );

    const caseLines = [
      "---",
      `name: ${caseRow.name}`,
      `slug: ${caseRow.slug}`,
      caseRow.description !== null && caseRow.description !== ""
        ? `description: ${caseRow.description}`
        : null,
      `exported: ${new Date().toISOString()}`,
      `entities: ${mdFiles.size}`,
      `evidence: ${evidenceRows.length}`,
      "---",
      "",
      `# ${caseRow.name}`,
      "",
      `${mdFiles.size} entities · ${evidenceRows.length} evidence items`,
      "",
      "## Entities",
      ...[...mdFiles.keys()].map((k) => `- [[${k.replace(/\.md$/, "")}]]`),
    ];

    mdFiles.set(
      "CASE.md",
      `${caseLines.filter((l) => l !== null).join("\n")}\n`
    );

    if (attestations.length > 0) {
      const attLines = [
        "---",
        `case: ${caseRow.slug}`,
        `exported: ${new Date().toISOString()}`,
        "---",
        "",
        "# Attestations",
        "",
      ];
      for (const att of attestations) {
        attLines.push(`## ${att.label ?? att.id.slice(0, 8)}`);
        if (att.notes !== null && att.notes !== "")
          attLines.push(`*${att.notes}*`, "");
        attLines.push(att.text ?? "", "");
      }
      mdFiles.set("evidence/attestations.md", attLines.join("\n"));
    }
  }

  return { files: mdFiles, evidenceRows };
}
