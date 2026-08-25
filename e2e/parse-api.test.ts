import { describe, expect, it } from "vitest";

import {
  e2eApiParsers,
  parseCaseList,
  parseEntity,
  parseEvidenceList,
} from "./parse-api";

describe("e2e parse-api", () => {
  it("parseCaseList accepts valid rows", () => {
    expect(parseCaseList([{ id: "a", name: "Case A" }])).toEqual([
      { id: "a", name: "Case A" },
    ]);
  });

  it("parseCaseList rejects malformed rows", () => {
    expect(() => parseCaseList([{ id: "a" }])).toThrow(
      "cases[0] missing id/name"
    );
  });

  it("parseEntity requires id and name", () => {
    expect(parseEntity({ id: "e1", name: "Ada" })).toEqual({
      id: "e1",
      name: "Ada",
    });
    expect(() => parseEntity({ id: "e1" })).toThrow(
      "entity response missing id/name"
    );
  });

  it("parseEvidenceList requires id on each row", () => {
    expect(parseEvidenceList([{ id: "ev1" }])).toEqual([{ id: "ev1" }]);
    expect(() => parseEvidenceList([{}])).toThrow("evidence[0] missing id");
  });

  it("e2eApiParsers exposes all parsers", () => {
    expect(e2eApiParsers.caseList).toBe(parseCaseList);
    expect(e2eApiParsers.evidenceList).toBe(parseEvidenceList);
  });
});
