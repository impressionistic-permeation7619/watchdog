import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const emitList = vi.fn();
  const emit = vi.fn();
  const emitOk = vi.fn();
  const fail = vi.fn();

  const client = {
    capabilities: {
      list: vi.fn().mockResolvedValue([
        {
          id: "web.page.enrich",
          kind: "web",
          egress: true,
          title: "Page enrich",
          description: "Fetch page metadata",
        },
      ]),
      listPlaybooks: vi.fn().mockResolvedValue([]),
    },
    cases: {
      list: vi.fn().mockResolvedValue([
        { id: "case-1", name: "Alpha", slug: "alpha", allowThirdPartyEgress: false },
      ]),
      get: vi.fn().mockResolvedValue({ id: "case-1", name: "Alpha" }),
    },
    claims: {
      list: vi.fn().mockResolvedValue([
        {
          id: "claim-1",
          text: "Claim",
          confidence: "unverified",
          class: "observation",
          retracted: false,
        },
      ]),
    },
    credentials: {
      list: vi.fn().mockResolvedValue([
        {
          name: "shodan",
          configured: true,
          updatedAt: "2026-01-01",
          label: "Shodan",
        },
      ]),
    },
    edges: {
      list: vi.fn().mockResolvedValue([
        {
          id: "edge-1",
          fromId: "a",
          toId: "b",
          predicate: "knows",
          confidence: "unverified",
        },
      ]),
    },
    entities: {
      list: vi.fn().mockResolvedValue([
        { id: "ent-1", kind: "person", name: "Jane", slug: "jane" },
      ]),
    },
  };

  const api = vi.fn(() => client);

  return { emitList, emit, emitOk, fail, api, client };
});

vi.mock("../../client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../client")>();
  return {
    ...actual,
    api: mocks.api,
    emitList: mocks.emitList,
    emit: mocks.emit,
    emitOk: mocks.emitOk,
    fail: mocks.fail,
  };
});

vi.mock("../../ids", () => ({
  resolveEntityId: vi.fn(async () => "entity-id-1"),
}));

import { capsCmd } from "../caps";
import { casesCmd } from "../cases";
import { claimsCmd } from "../claims";
import { credentialsCmd } from "../credentials";
import { edgesCmd } from "../edges";
import { entitiesCmd } from "../entities";

describe("CLI noun commands", () => {
  it("capsCmd lists capabilities", async () => {
    await capsCmd.run?.({ args: {} } as never);
    expect(mocks.client.capabilities.list).toHaveBeenCalled();
    expect(mocks.emitList).toHaveBeenCalled();
  });

  it("casesCmd lists cases", async () => {
    await casesCmd.run?.({ args: {} } as never);
    expect(mocks.client.cases.list).toHaveBeenCalled();
    expect(mocks.emitList).toHaveBeenCalled();
  });

  it("claimsCmd requires case and entity then lists claims", async () => {
    await claimsCmd.run?.({ args: { case: "case-1", entity: "jane" } } as never);
    expect(mocks.client.claims.list).toHaveBeenCalled();
    expect(mocks.emitList).toHaveBeenCalled();
  });

  it("credentialsCmd lists vault credentials", async () => {
    await credentialsCmd.run?.({ args: {} } as never);
    expect(mocks.client.credentials.list).toHaveBeenCalled();
    expect(mocks.emitList).toHaveBeenCalled();
  });

  it("edgesCmd lists edges for a case entity", async () => {
    await edgesCmd.run?.({ args: { case: "case-1", entity: "jane" } } as never);
    expect(mocks.client.edges.list).toHaveBeenCalled();
    expect(mocks.emitList).toHaveBeenCalled();
  });

  it("entitiesCmd lists entities for a case", async () => {
    await entitiesCmd.run?.({ args: { case: "case-1" } } as never);
    expect(mocks.client.entities.list).toHaveBeenCalled();
    expect(mocks.emitList).toHaveBeenCalled();
  });
});
