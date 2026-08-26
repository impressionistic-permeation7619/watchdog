import { fireEvent, render, screen } from "@testing-library/react";
import { KeyRoundIcon, ShieldIcon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import {
  SettingsShell,
  type SettingsNavItem,
} from "@/domains/settings/components/settings-shell";

const ITEMS: SettingsNavItem[] = [
  {
    id: "account",
    label: "Account",
    description: "Profile and identity settings.",
    icon: ShieldIcon,
  },
  {
    id: "credentials",
    label: "Credentials",
    description: "Cap provider secrets stored in the vault.",
    icon: KeyRoundIcon,
  },
];

describe("SettingsShell", () => {
  it("renders the active section heading and child content", () => {
    render(
      <SettingsShell
        items={ITEMS}
        activeTab="account"
        onTabChange={vi.fn()}
      >
        <div>Account panel</div>
      </SettingsShell>
    );

    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(
      screen.getByText("Profile and identity settings.")
    ).toBeInTheDocument();
    expect(screen.getByText("Account panel")).toBeInTheDocument();
  });

  it("calls onTabChange when a nav item is selected", () => {
    const onTabChange = vi.fn();

    render(
      <SettingsShell
        items={ITEMS}
        activeTab="account"
        onTabChange={onTabChange}
      >
        <div>Panel</div>
      </SettingsShell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Credentials" }));
    expect(onTabChange).toHaveBeenCalledWith("credentials");
  });
});
