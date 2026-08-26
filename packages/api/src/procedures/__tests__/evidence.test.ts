import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

const { listEvidenceForCase } = vi.hoisted(() => ({
  listEvidenceForCase: vi.fn(),
}));

vi.mock("@watchdog/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@watchdog/core")>();
  return {
    ...actual,
    listEvidenceForCase,
    dumpPaste: vi.fn(),
    dumpUrl: vi.fn(),
    softDeleteEvidence: vi.fn(),
    restoreEvidence: vi.fn(),
    attachEvidenceEntity: vi.fn(),
    presignUpload: vi.fn(),
    confirmFileUpload: vi.fn(),
    getEvidenceDownloadUrl: vi.fn(),
    processEvidence: vi.fn(),
    enrichUrlEvidence: vi.fn(),
  };
});

import { list } from "../evidence";

const actor = { userId: "u1", email: "a@test.local", name: "Agent" };

describe("evidence procedures", () => {
  it("lists evidence for a case", async () => {
    listEvidenceForCase.mockResolvedValueOnce([
      {
        id: "00000000-0000-4000-8000-000000000040",
        caseId: "00000000-0000-4000-8000-000000000001",
        entityId: null,
        kind: "file",
        label: "notes.txt",
        notes: null,
        mime: "text/plain",
        uri: null,
        sha256: null,
        text: null,
        sourceUrl: null,
        actorId: "u1",
        capturedAt: "2026-01-01T00:00:00.000Z",
        processedAt: null,
        deletedAt: null,
      },
    ]);

    const client = createRouterClient(
      { list },
      {
        context: {
          headers: new Headers(),
          actor,
          authMethod: "session",
        },
      }
    );

    await expect(
      client.list({ caseId: "00000000-0000-4000-8000-000000000001" })
    ).resolves.toHaveLength(1);
  });
});
