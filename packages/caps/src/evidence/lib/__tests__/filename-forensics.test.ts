import { describe, expect, it } from "vitest";

import {
  describeFilenameForensics,
  filenameFromUrlOrLabel,
} from "../filename-forensics";

describe("filename forensics", () => {
  it("filenameFromUrlOrLabel extracts basename from URLs", () => {
    expect(
      filenameFromUrlOrLabel("https://cdn.example.org/path/IMG_1234.jpg")
    ).toBe("IMG_1234.jpg");
  });

  it("describeFilenameForensics detects iOS camera roll pattern", () => {
    const hit = describeFilenameForensics("IMG_1234.jpg");
    expect(hit?.label).toBe("iOS camera roll");
    expect(hit?.detail).toContain("IMG_1234");
  });

  it("returns null for generic filenames", () => {
    expect(describeFilenameForensics("notes.txt")).toBeNull();
  });
});
