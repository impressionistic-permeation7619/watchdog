import { createServerFn } from "@tanstack/react-start";

import {
  listRecentActivityInputSchema,
  type ActivityItem,
} from "@/domains/activity/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";

export const listRecentActivityFn = createServerFn({ method: "GET" })
  .validator(listRecentActivityInputSchema)
  .handler(
    async ({ data, context }): Promise<ActivityItem[]> =>
      orpcForActor(actorFromSession(context.session)).activity.listRecent(data)
  );
