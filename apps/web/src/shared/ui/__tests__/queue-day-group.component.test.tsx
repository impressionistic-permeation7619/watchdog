import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueueDayGroup } from "@/shared/ui/queue-day-group";
import { QueueRow, QueueRowTitle } from "@/shared/ui/queue-row";

describe("QueueDayGroup", () => {
  it("renders the day label, count, and child rows", () => {
    render(
      <QueueDayGroup label="Today" count={2} listLabel="Today queue">
        <li>
          <QueueRow>
            <QueueRowTitle>Alpha</QueueRowTitle>
          </QueueRow>
        </li>
      </QueueDayGroup>
    );

    expect(screen.getByRole("heading", { name: /Today/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Today queue")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
