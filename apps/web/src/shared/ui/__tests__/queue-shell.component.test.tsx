import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueueShell } from "@/shared/ui/queue-shell";

describe("QueueShell", () => {
  it("renders header and body inside a labeled aside", () => {
    render(
      <QueueShell header={<div>Header</div>} aria-label="Jobs queue">
        <p>Body</p>
      </QueueShell>
    );
    expect(screen.getByLabelText("Jobs queue")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});
