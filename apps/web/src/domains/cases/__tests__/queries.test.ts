import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/cases/cases.functions", () => ({
  getCasesContextFn: vi.fn(),
  getCaseByIdFn: vi.fn(),
  getCaseBySlugFn: vi.fn(),
}));

import {
  caseByIdQuery,
  caseBySlugQuery,
  casesContextQuery,
  casesKeys,
} from "@/domains/cases/queries";

describe("cases queries", () => {
  it("builds stable query keys", () => {
    expect(casesKeys.all).toEqual(["cases"]);
    expect(casesKeys.context()).toEqual(["cases", "context"]);
    expect(casesKeys.detail("case-1")).toEqual(["cases", "detail", "case-1"]);
    expect(casesKeys.bySlug("alpha")).toEqual(["cases", "bySlug", "alpha"]);
  });

  it("uses default stale and gc tiers for context and detail queries", () => {
    expect(casesContextQuery()).toMatchObject({
      queryKey: casesKeys.context(),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
    expect(caseByIdQuery("case-1")).toMatchObject({
      queryKey: casesKeys.detail("case-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
    expect(caseBySlugQuery("alpha")).toMatchObject({
      queryKey: casesKeys.bySlug("alpha"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
