import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FieldSelect } from "@/shared/ui/field-select";

describe("FieldSelect", () => {
  it("shows placeholder when value is unmatched", () => {
    render(
      <FieldSelect
        value="missing"
        onValueChange={() => {}}
        options={[{ value: "a", label: "Alpha" }]}
        placeholder="Pick one"
        aria-label="Pick one"
      />
    );
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("calls onValueChange with the selected option value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FieldSelect
        value=""
        onValueChange={onValueChange}
        options={[
          { value: "", label: "None" },
          { value: "a", label: "Alpha" },
        ]}
        aria-label="Pick one"
      />
    );
    await user.click(screen.getByRole("combobox", { name: "Pick one" }));
    await user.click(await screen.findByRole("option", { name: "Alpha" }));
    expect(onValueChange).toHaveBeenCalledWith("a");
  });
});
