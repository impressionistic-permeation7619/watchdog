import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/entities/questions/questions.functions", () => ({
  listQuestionsFn: vi.fn(),
}));

import {
  questionsKeys,
  questionsListQuery,
} from "@/domains/entities/questions/queries";

describe("questions queries", () => {
  it("builds case- and entity-scoped keys", () => {
    expect(questionsKeys.prefix("case-1")).toEqual(["questions", "case-1"]);
    expect(questionsKeys.all("case-1", "ent-1")).toEqual([
      "questions",
      "case-1",
      "ent-1",
    ]);
  });

  it("uses default stale and gc tiers for entity questions", () => {
    expect(questionsListQuery("case-1", "ent-1")).toMatchObject({
      queryKey: questionsKeys.all("case-1", "ent-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
