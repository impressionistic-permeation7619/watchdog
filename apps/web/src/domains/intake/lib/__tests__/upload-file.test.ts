import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

const presignUploadFn = vi.hoisted(() => vi.fn());
const confirmFileUploadFn = vi.hoisted(() => vi.fn());

vi.mock("@/domains/intake/intake.functions", () => ({
  presignUploadFn,
  confirmFileUploadFn,
}));

import { uploadFileEvidence } from "@/domains/intake/lib/upload-file";

describe("uploadFileEvidence", () => {
  it("rejects empty files", async () => {
    await expect(
      uploadFileEvidence({
        caseId: testId(10),
        file: new File([], "empty.txt"),
      })
    ).rejects.toThrow("File is empty");
  });

  it("uploads via presign and confirm", async () => {
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    presignUploadFn.mockResolvedValue({
      url: "https://minio.test/put",
      headers: { "Content-Type": "text/plain" },
      uri: "s3://bucket/note.txt",
      sha256: "deadbeef",
      mime: "text/plain",
      byteLength: file.size,
    });
    confirmFileUploadFn.mockResolvedValue({
      id: testId(40),
      caseId: testId(10),
      kind: "file",
      label: "note.txt",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 })
    );

    const created = await uploadFileEvidence({
      caseId: testId(10),
      file,
      label: "note.txt",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://minio.test/put",
      expect.objectContaining({ method: "PUT", body: file })
    );
    expect(confirmFileUploadFn).toHaveBeenCalled();
    expect(created.id).toBe(testId(40));

    vi.unstubAllGlobals();
  });
});
