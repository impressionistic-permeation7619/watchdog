import { Link } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";

import { ArtifactContent } from "@/domains/jobs/components/artifact-content";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import {
  artifactDefaultOpen,
  orderJobArtifacts,
} from "@/domains/jobs/lib/artifacts";
import { DetailStatusChip } from "@/shared/ui/detail-status-chip";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import { IdChip } from "@/shared/ui/id-chip";
import { LocalDateTime } from "@/shared/ui/local-date-time";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/shadcn/collapsible";
import { StatusBadge, capabilityLabel } from "@/shared/ui/vocab";

export function ProcessRunCard({
  job,
  defaultOpen = false,
}: {
  job: JobListRecord;
  defaultOpen?: boolean;
}) {
  const live = job.status === "queued" || job.status === "running";

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="border-border overflow-hidden rounded-md border"
    >
      <div className="flex w-full items-start">
        <CollapsibleTrigger className="group/run-trigger hover:bg-muted/40 focus-visible:ring-ring/50 flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left outline-none focus-visible:ring-2">
          <ChevronDownIcon
            className="text-muted-foreground mt-0.5 size-3.5 shrink-0 transition-transform group-aria-expanded/run-trigger:rotate-180"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-foreground text-xs font-medium">
                {capabilityLabel(job.capabilityId)}
              </p>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={job.status} size="md" />
                {live ? <DetailStatusChip>live</DetailStatusChip> : null}
              </div>
            </div>
            <p className="text-label-mono-sm text-muted-foreground mt-1.5 tabular-nums">
              <LocalDateTime value={job.createdAt} />
              {job.output && job.output.length > 0 ? (
                <>
                  <span aria-hidden> · </span>
                  {job.output.length} artifact
                  {job.output.length === 1 ? "" : "s"}
                </>
              ) : null}
            </p>
          </div>
        </CollapsibleTrigger>
        <div className="flex shrink-0 items-start py-2.5 pr-3">
          <IdChip value={job.id} copyable />
        </div>
      </div>

      <CollapsibleContent className="border-border space-y-3 border-t px-3 py-3">
        {job.resultSummary !== null && job.resultSummary !== "" ? (
          <div className="bg-muted/30 rounded-md border px-3 py-2">
            <p className="text-muted-foreground text-xs font-medium">Summary</p>
            <p className="mt-0.5 text-sm leading-relaxed">
              {job.resultSummary}
            </p>
          </div>
        ) : null}

        <FormInlineError>{job.error}</FormInlineError>

        {job.output && job.output.length > 0 ? (
          <div className="flex flex-col gap-2">
            {orderJobArtifacts(job.output).map((art, i) => (
              <ArtifactContent
                key={`${art.sha256}-${art.name}`}
                uri={art.uri}
                mime={art.mime}
                name={art.name}
                defaultOpen={artifactDefaultOpen(art.name, i)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            {live
              ? "Still running — output appears when the job finishes."
              : "No artifacts from this run."}
          </p>
        )}

        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          className="h-7 self-start text-xs"
          render={<Link to="/jobs" search={{ jobId: job.id }} />}
        >
          Open in Jobs
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
