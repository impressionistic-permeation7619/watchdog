import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import type { TaskRecord } from "@/domains/tasks/types";

const useTaskWorkspaceMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/domains/tasks/hooks/use-task-workspace", () => ({
  useTaskWorkspace: (...args: unknown[]) => useTaskWorkspaceMock(...args),
}));

vi.mock("@/domains/tasks/components/task-table", () => ({
  TaskTable: ({ tasks }: { tasks: TaskRecord[] }) => (
    <div>Task table ({tasks.length})</div>
  ),
}));

vi.mock("@/domains/tasks/components/task-form-dialog", () => ({
  TaskFormDialog: ({ open }: { open: boolean }) =>
    open ? <div>Task form open</div> : null,
}));

import { CaseTasksTab } from "@/domains/tasks/components/case-tasks-tab";

const CASE_ID = testId(10);

const TASK: TaskRecord = {
  id: testId(20),
  caseId: CASE_ID,
  entityId: null,
  title: "Follow up lead",
  description: null,
  status: "backlog",
  priority: null,
  dueDate: null,
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function workspace(overrides: Record<string, unknown> = {}) {
  return {
    tasks: [],
    entities: [],
    entityById: new Map(),
    selected: null,
    formError: null,
    updateBusy: false,
    handleSelect: vi.fn(),
    closeSelected: vi.fn(),
    handleUpdate: vi.fn(),
    handleDelete: vi.fn(),
    ...overrides,
  };
}

describe("CaseTasksTab", () => {
  it("shows an empty state when the case has no tasks", () => {
    useTaskWorkspaceMock.mockReturnValue(workspace());

    render(<CaseTasksTab caseId={CASE_ID} />);

    expect(screen.getByText("Open Tasks")).toBeInTheDocument();
    expect(
      screen.getByText("Create tasks on the Tasks board for this case.")
    ).toBeInTheDocument();
  });

  it("renders the task table when tasks exist", () => {
    useTaskWorkspaceMock.mockReturnValue(
      workspace({ tasks: [TASK], selected: TASK })
    );

    render(<CaseTasksTab caseId={CASE_ID} />);

    expect(screen.getByText("Task table (1)")).toBeInTheDocument();
    expect(screen.getByText("Open board")).toBeInTheDocument();
    expect(screen.getByText("Task form open")).toBeInTheDocument();
    expect(useTaskWorkspaceMock).toHaveBeenCalledWith(CASE_ID);
  });
});
