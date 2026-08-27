import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueueHeader } from "@/shared/ui/queue-header";

describe("QueueHeader", () => {
  it("renders the label, count, and actions", () => {
    render(
      <QueueHeader
        label="Jobs"
        count={12}
        actions={<button type="button">Refresh</button>}
      />
    );

    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
