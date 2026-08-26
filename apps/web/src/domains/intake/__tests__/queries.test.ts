import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/intake/intake.functions", () => ({
  getEvidenceDownloadUrlFn: vi.fn(),
  listEvidenceFn: vi.fn(),
}));

import {
  evidenceDownloadUrlQuery,
  evidenceKeys,
  evidenceListQuery,
} from "@/domains/intake/queries";

describe("intake queries", () => {
  it("builds evidence list and download keys", () => {
    expect(evidenceKeys.all("case-1")).toEqual(["evidence", "case-1"]);
    expect(evidenceKeys.list("case-1")).toEqual([
      "evidence",
      "case-1",
      "list",
      "active",
    ]);
    expect(evidenceKeys.list("case-1", true)).toEqual([
      "evidence",
      "case-1",
      "list",
      "hidden",
    ]);
    expect(evidenceKeys.download("case-1", "ev-1")).toEqual([
      "evidence",
      "case-1",
      "download",
      "ev-1",
    ]);
  });

  it("uses default stale tiers and gates download by evidence id", () => {
    expect(evidenceListQuery("case-1")).toMatchObject({
      queryKey: evidenceKeys.list("case-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
    expect(evidenceDownloadUrlQuery("case-1", "")).toMatchObject({
      enabled: false,
    });
    expect(evidenceDownloadUrlQuery("case-1", "ev-1")).toMatchObject({
      enabled: true,
      queryKey: evidenceKeys.download("case-1", "ev-1"),
    });
  });
});
