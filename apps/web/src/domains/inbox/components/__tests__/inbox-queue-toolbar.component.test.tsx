import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InboxQueueToolbar } from "@/domains/inbox/components/inbox-queue-toolbar";
import { PENDING_INBOX_FILTERS } from "@/domains/inbox/lib/filters";

describe("InboxQueueToolbar", () => {
  it("renders search and pending status filter controls", () => {
    render(
      <InboxQueueToolbar
        filters={PENDING_INBOX_FILTERS}
        onFiltersChange={vi.fn()}
        pendingCount={3}
      />
    );

    expect(screen.getByLabelText("Search proposals")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
