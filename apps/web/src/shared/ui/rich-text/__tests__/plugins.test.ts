import { describe, expect, it } from "vitest";

import { RichTextEditorPlugins } from "@/shared/ui/rich-text/plugins";

describe("RichTextEditorPlugins", () => {
  it("registers the expected Plate plugin bundle", () => {
    expect(RichTextEditorPlugins).toHaveLength(4);
    expect(RichTextEditorPlugins.every((plugin) => plugin != null)).toBe(true);
  });
});
