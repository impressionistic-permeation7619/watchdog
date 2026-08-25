import type { ErrorComponentProps } from "@tanstack/react-router";

import { errMessage } from "@/lib/utils";
import { FetchErrorAlert } from "@/shared/ui/fetch-error-alert";

/** Shared route errorComponent for data-bearing pages. */
export function RouteError({ error }: ErrorComponentProps) {
  return (
    <div className="p-6">
      <FetchErrorAlert error={errMessage(error, "Failed to load page")} />
    </div>
  );
}
