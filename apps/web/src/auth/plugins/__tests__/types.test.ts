import { describe, expect, it } from "vitest";

import type {
  AuthPlugin,
  AuthViewProps,
  SettingsViewProps,
} from "@/auth/plugins/types";

describe("auth plugin types", () => {
  it("exports shadcn auth plugin view prop types", () => {
    const view: AuthViewProps = {
      className: "auth-view",
      socialLayout: "auto",
    };
    const settings: SettingsViewProps = { className: "settings-view" };
    const plugin: AuthPlugin | null = null;
    expect(view.className).toBe("auth-view");
    expect(settings.className).toBe("settings-view");
    expect(plugin).toBeNull();
  });
});
