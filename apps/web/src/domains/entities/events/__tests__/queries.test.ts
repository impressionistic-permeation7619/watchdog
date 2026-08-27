import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/entities/events/events.functions", () => ({
  listEventsFn: vi.fn(),
}));

import { eventsKeys, eventsListQuery } from "@/domains/entities/events/queries";

describe("events queries", () => {
  it("builds case- and entity-scoped keys", () => {
    expect(eventsKeys.prefix("case-1")).toEqual(["events", "case-1"]);
    expect(eventsKeys.all("case-1", "ent-1")).toEqual([
      "events",
      "case-1",
      "ent-1",
    ]);
  });

  it("uses default stale and gc tiers for entity events", () => {
    expect(eventsListQuery("case-1", "ent-1")).toMatchObject({
      queryKey: eventsKeys.all("case-1", "ent-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
