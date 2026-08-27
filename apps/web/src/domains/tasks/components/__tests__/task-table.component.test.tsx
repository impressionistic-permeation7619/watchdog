import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { TaskEntityLabel, TaskRecord } from "@/domains/tasks/types";
import { testId } from "@watchdog/test-kit";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getAnimations = vi.fn(() => []);
});

import { TaskTable } from "@/domains/tasks/components/task-table";

const CASE_ID = testId(10);
const ENTITY_ID = testId(30);

const ENTITY: TaskEntityLabel = {
  id: ENTITY_ID,
  name: "Target Alpha",
  kind: "person",
};

function task(
  id: string,
  title: string,
  overrides: Partial<TaskRecord> = {}
): TaskRecord {
  return {
    id,
    caseId: CASE_ID,
    entityId: null,
    title,
    description: null,
    status: "backlog",
    priority: null,
    dueDate: null,
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function clickRow(title: string) {
  const cell = screen.getByText(title);
  const row = cell.closest("tr");
  if (!row) throw new Error(`Missing row for ${title}`);
  fireEvent.pointerDown(row, { button: 0 });
  fireEvent.click(row);
}

describe("TaskTable", () => {
  it("renders tasks with entity names and supports row selection", () => {
    const onSelect = vi.fn();
    const tasks = [
      task(testId(20), "Follow WHOIS", { entityId: ENTITY_ID }),
      task(testId(21), "Review inbox"),
    ];
    const entityById = new Map([[ENTITY_ID, ENTITY]]);

    render(
      <TaskTable tasks={tasks} entityById={entityById} onSelect={onSelect} />
    );

    expect(screen.getByText("Follow WHOIS")).toBeInTheDocument();
    expect(screen.getByText("Target Alpha")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter tasks")).toBeInTheDocument();

    clickRow("Review inbox");
    expect(onSelect).toHaveBeenCalledWith(tasks[1]);
  });

  it("filters tasks with the search field", () => {
    const tasks = [
      task(testId(20), "Alpha task"),
      task(testId(21), "Beta task"),
    ];

    render(<TaskTable tasks={tasks} onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Filter tasks"), {
      target: { value: "beta" },
    });

    expect(screen.queryByText("Alpha task")).not.toBeInTheDocument();
    expect(screen.getByText("Beta task")).toBeInTheDocument();
  });

  it("hides search and pagination in compact mode", () => {
    render(
      <TaskTable
        compact
        tasks={[task(testId(20), "Compact task")]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByLabelText("Filter tasks")).not.toBeInTheDocument();
    expect(screen.getByText("Compact task")).toBeInTheDocument();
  });

  it("shows an add row and empty message when onAdd is provided", () => {
    const onAdd = vi.fn();

    render(<TaskTable tasks={[]} onSelect={vi.fn()} onAdd={onAdd} />);

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("row", { name: "Add task" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
