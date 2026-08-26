import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  confidenceLabel,
  ConfidenceBadge,
  CONFIDENCE_LABELS,
} from "@/shared/ui/vocab/confidence";

describe("Confidence vocab", () => {
  it("maps tiers to labels", () => {
    expect(confidenceLabel("confirmed")).toBe(CONFIDENCE_LABELS.confirmed);
  });

  it("renders confidence badge copy", () => {
    render(<ConfidenceBadge confidence="possible" />);
    expect(screen.getByText("Possible")).toBeInTheDocument();
  });
});
