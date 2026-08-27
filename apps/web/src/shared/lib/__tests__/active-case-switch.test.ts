import { describe, expect, it } from "vitest";

import { isCaseOverviewPath } from "@/shared/lib/case-path";

describe("isCaseOverviewPath", () => {
  it("matches overview routes but not the manage list", () => {
    expect(isCaseOverviewPath("/cases/ada-lovelace")).toBe(true);
    expect(isCaseOverviewPath("/cases/ada-lovelace/entities")).toBe(true);
    expect(isCaseOverviewPath("/cases")).toBe(false);
  });
});
