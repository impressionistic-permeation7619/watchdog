import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PATCH_OP_LABELS,
  patchOpLabel,
  PatchOpBadge,
  PATCH_RESOURCE_META,
} from "@/shared/ui/vocab/patch-op";

describe("patch-op vocab", () => {
  it("labels patch operations and resources", () => {
    expect(patchOpLabel("create")).toBe(PATCH_OP_LABELS.create);
    expect(PATCH_RESOURCE_META.claim.label).toBe("Claim");
  });

  it("renders patch op badge copy", () => {
    render(<PatchOpBadge op="update" />);
    expect(screen.getByText("Update")).toBeInTheDocument();
  });
});
