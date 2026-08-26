import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ClaimClassBadge,
  ENTITY_KIND_LABELS,
  isEntityKind,
  kindLabel,
  KindBadge,
} from "@/shared/ui/vocab/kind";

describe("kind vocab", () => {
  it("detects entity kinds and labels unknown values", () => {
    expect(isEntityKind("person")).toBe(true);
    expect(isEntityKind("unknown")).toBe(false);
    expect(kindLabel("email")).toBe("Email");
    expect(kindLabel("custom_kind")).toMatch(/Custom/);
  });

  it("renders kind and claim-class badges", () => {
    render(<KindBadge kind="person" />);
    expect(screen.getByText(ENTITY_KIND_LABELS.person)).toBeInTheDocument();

    render(<ClaimClassBadge claimClass="observation" />);
    expect(screen.getByText("Observation")).toBeInTheDocument();
  });
});
