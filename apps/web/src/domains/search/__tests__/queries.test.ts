import { describe, expect, it, vi } from "vitest";

import { SEARCH_MIN_QUERY_LENGTH } from "@/domains/search/types";

vi.mock("@/domains/search/search.functions", () => ({
  searchCaseFn: vi.fn(),
}));

import { searchCaseQuery, searchKeys } from "@/domains/search/queries";

describe("search queries", () => {
  it("builds trimmed case search keys", () => {
    expect(searchKeys.all).toEqual(["search"]);
    expect(searchKeys.case("case-1", "alpha")).toEqual([
      "search",
      "case",
      "case-1",
      "alpha",
    ]);
  });

  it("enables search only for non-empty case id and long enough query", () => {
    expect(searchCaseQuery("case-1", "  a  ")).toMatchObject({
      queryKey: searchKeys.case("case-1", "a"),
      enabled: false,
    });
    expect(searchCaseQuery("case-1", "  alpha  ")).toMatchObject({
      queryKey: searchKeys.case("case-1", "alpha"),
      enabled: "alpha".length >= SEARCH_MIN_QUERY_LENGTH,
      staleTime: 15_000,
    });
    expect(searchCaseQuery("", "alpha")).toMatchObject({ enabled: false });
  });
});
