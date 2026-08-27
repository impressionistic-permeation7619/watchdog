import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHydrated } from "@/shared/hooks/use-hydrated";

function HydratedProbe() {
  const hydrated = useHydrated();
  return <span>{hydrated ? "hydrated" : "pending"}</span>;
}

describe("useHydrated", () => {
  it("reports hydrated in jsdom after mount", () => {
    render(<HydratedProbe />);
    expect(screen.getByText("hydrated")).toBeInTheDocument();
  });
});
