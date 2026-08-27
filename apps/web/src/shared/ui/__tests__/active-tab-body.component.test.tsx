import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActiveTabBody, SuspenseTabBody } from "@/shared/ui/active-tab-body";

describe("ActiveTabBody", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <ActiveTabBody active={false}>
        <p>Hidden</p>
      </ActiveTabBody>
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows a skeleton while pending", () => {
    render(
      <ActiveTabBody active pending pendingSections={2}>
        <p>Ready</p>
      </ActiveTabBody>
    );
    expect(screen.queryByText("Ready")).toBeNull();
  });

  it("renders children when active and not pending", () => {
    render(
      <ActiveTabBody active>
        <p>Ready</p>
      </ActiveTabBody>
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});

describe("SuspenseTabBody", () => {
  it("wraps children in suspense with a skeleton fallback", () => {
    render(
      <SuspenseTabBody>
        <p>Suspense child</p>
      </SuspenseTabBody>
    );
    expect(screen.getByText("Suspense child")).toBeInTheDocument();
  });
});
