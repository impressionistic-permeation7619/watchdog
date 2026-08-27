import { describe, expect, it, vi } from "vitest";

const { fetchBytesTool } = vi.hoisted(() => ({
  fetchBytesTool: vi.fn(),
}));

vi.mock("@watchdog/tools", () => ({
  fetchBytes: fetchBytesTool,
}));

import { fetchBytes } from "../fetch-bytes";

describe("url.enrich fetchBytes", () => {
  it("delegates to tools.fetchBytes with enrich defaults", async () => {
    fetchBytesTool.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));

    const bytes = await fetchBytes(
      "https://example.com",
      AbortSignal.timeout(5000)
    );

    expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchBytesTool).toHaveBeenCalledWith(
      "https://example.com",
      expect.any(AbortSignal),
      expect.objectContaining({ maxBytes: expect.any(Number) })
    );
  });
});
