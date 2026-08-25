import type { PatchOp } from "@watchdog/schemas";

import { suppressKnownFindings } from "../../graph/finding-suppress";
import type { JobLog } from "./helpers";

export interface SuppressResult {
  kept: PatchOp[];
  suppressed: number;
}

/** Drop ops already on Graph / pending Proposal / rejected FP memory. */
export async function suppressStage(
  caseId: string,
  patch: PatchOp[],
  jobLog: JobLog
): Promise<SuppressResult> {
  if (patch.length === 0) {
    return { kept: [], suppressed: 0 };
  }
  const { kept, suppressed } = await suppressKnownFindings(caseId, patch);
  if (suppressed > 0) {
    jobLog.log(`suppressed ${suppressed} known/rejected finding(s)`);
  }
  return { kept, suppressed };
}
