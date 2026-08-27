import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/ui/field-select", () => ({
  FieldSelect: ({
    value,
    onValueChange,
    options,
    "aria-label": ariaLabel,
  }: {
    value: string;
    onValueChange: (next: string) => void;
    options: { value: string; label: string }[];
    "aria-label"?: string;
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => {
        onValueChange(e.target.value);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

import { EditableSelectCell } from "@/shared/ui/data-table/editable-select-cell";

describe("EditableSelectCell", () => {
  it("commits a new value when the selection changes", () => {
    const onCommit = vi.fn();
    render(
      <EditableSelectCell
        value="open"
        options={[
          { value: "open", label: "Open" },
          { value: "closed", label: "Closed" },
        ]}
        onCommit={onCommit}
        aria-label="Status"
      />
    );

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "closed" },
    });
    expect(onCommit).toHaveBeenCalledWith("closed");
  });
});
