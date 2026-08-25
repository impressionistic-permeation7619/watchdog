import type { z } from "zod";

import {
  defineCapability,
  type CapContext,
  type CapInterpretOpts,
  type CapInterpretResult,
  type CapabilityDef,
} from "@watchdog/cap-sdk";
import type { JsonValue } from "@watchdog/schemas";

import { uploadJsonReportPair } from "./upload-json-report-pair";

type CollectCapDef<TSchema extends z.ZodType, TSnap> = Omit<
  CapabilityDef<TSchema>,
  "run" | "interpret"
> & {
  schema: z.ZodType<TSnap>;
  reportLabel: string;
  fetch: (ctx: CapContext<z.infer<TSchema>>) => Promise<{
    snap: TSnap;
    artifactName: string;
  }>;
  interpretSnap: (
    snap: TSnap,
    opts: CapInterpretOpts<z.infer<TSchema>>
  ) => CapInterpretResult | Promise<CapInterpretResult>;
};

/** Collect/act Caps: JSON report pair upload + pure interpret(snap). */
export function defineCollectCap<TSchema extends z.ZodType, TSnap>(
  def: CollectCapDef<TSchema, TSnap>
): CapabilityDef<TSchema> {
  const { schema, reportLabel, fetch, interpretSnap, ...meta } = def;
  return defineCapability({
    ...meta,
    kind: meta.kind ?? "collect",
    async run(ctx) {
      const { snap, artifactName } = await fetch(ctx);
      const { report, artifact } = await uploadJsonReportPair(
        ctx.uploadArtifact,
        snap,
        artifactName
      );
      return { artifacts: [report, artifact] };
    },
    async interpret(report: JsonValue, opts) {
      const parsed = schema.safeParse(report);
      if (!parsed.success) {
        throw new Error(
          `Invalid ${reportLabel} report.json shape: ${parsed.error.message}`
        );
      }
      return interpretSnap(parsed.data, opts);
    },
  });
}
