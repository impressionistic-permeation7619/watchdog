import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  taskPriorityLabel,
  TaskPriorityBadge,
  TASK_PRIORITY_TONE_MAP,
} from "@/shared/ui/vocab/task-priority";

describe("task-priority vocab", () => {
  it("maps priorities to labels and status tones", () => {
    expect(taskPriorityLabel("urgent")).toBe("Urgent");
    expect(TASK_PRIORITY_TONE_MAP.urgent).toBe("failed");
  });

  it("renders priority badge copy", () => {
    render(<TaskPriorityBadge priority="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
