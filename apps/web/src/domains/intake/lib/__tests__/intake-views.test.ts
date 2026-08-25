import { describe, expect, it } from "vitest";

import type { EvidenceRecord } from "@/domains/intake/types";
import { testId } from "@watchdog/test-kit";

import {
  evidenceHasEnrichableUrl,
  evidenceTitle,
  producingCapJob,
} from "../evidence.ts";
import {
  EMPTY_INTAKE_FILTERS,
  filterIntakeQueue,
  intakeFiltersActive,
} from "../filters.ts";

function evidence(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    id: testId(40),
    caseId: testId(10),
    entityId: null,
    kind: "attestation",
    label: "note",
    notes: null,
    mime: "text/plain",
    uri: null,
    sha256: null,
    text: "hello",
    sourceUrl: null,
    actorId: "test-actor",
    capturedAt: "2026-01-01T00:00:00.000Z",
    processedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe("intake filters", () => {
  it("filters unattached unprocessed rows", () => {
    expect(intakeFiltersActive(EMPTY_INTAKE_FILTERS)).toBe(false);
    const attached = evidence({
      id: testId(41),
      entityId: testId(20),
      processedAt: "2026-01-02T00:00:00.000Z",
    });
    const open = evidence();
    const filtered = filterIntakeQueue([attached, open], {
      q: "",
      unprocessedOnly: true,
      unattachedOnly: true,
      hiddenOnly: false,
    });
    expect(filtered.map((row) => row.id)).toEqual([open.id]);
  });
});

describe("intake evidence helpers", () => {
  it("titles from label and detects enrichable URLs", () => {
    expect(evidenceTitle(evidence())).toBe("note");
    expect(
      evidenceHasEnrichableUrl(
        evidence({ sourceUrl: "https://mailhost.test/" })
      )
    ).toBe(true);
    expect(producingCapJob([], testId(40))).toBeNull();
  });
});
