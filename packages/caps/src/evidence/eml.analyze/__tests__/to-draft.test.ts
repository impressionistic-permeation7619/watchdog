import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";

import { emlAnalyzeToDraft } from "../to-draft.ts";

describe("emlAnalyzeToDraft", () => {
  it("promotes emails and urls to identifiers", () => {
    const draft = emlAnalyzeToDraft({
      evidenceId: testId(40),
      queriedAt: "2026-01-01T00:00:00.000Z",
      headers: { from: "Ada <ada@mailhost.test>", subject: "Hello" },
      from: "Ada <ada@mailhost.test>",
      to: null,
      subject: "Hello",
      messageId: "<1@mailhost.test>",
      date: null,
      receivedChain: ["from mailhost.test"],
      urls: ["https://mailhost.test/note"],
      emails: ["ada@mailhost.test"],
      bodyPreview: "See https://mailhost.test/note",
    });
    expect(
      draft.identifiers.some(
        (row) => row.type === "email" && row.value === "ada@mailhost.test"
      )
    ).toBe(true);
    expect(
      draft.identifiers.some(
        (row) => row.type === "url" && row.value.includes("mailhost.test")
      )
    ).toBe(true);
    expect(draft.claims[0]?.text).toMatch(/Hello/);
  });
});
