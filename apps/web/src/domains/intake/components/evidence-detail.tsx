import { DownloadIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  EvidenceDetailHeader,
  EvidenceHeaderActions,
} from "@/domains/intake/components/evidence-detail-header";
import { ProcessRunCard } from "@/domains/intake/components/process-run-card";
import { useEvidenceBlob } from "@/domains/intake/hooks/use-evidence-blob";
import type { IntakeEvidenceActions } from "@/domains/intake/hooks/use-intake-actions";
import {
  ENRICHED_MD_ARTIFACT,
  enrichJobsForEvidence,
  evidenceHasEnrichableUrl,
  evidenceTitle,
  latestEnrichOutput,
  processJobsForEvidence,
  producingCapJob,
} from "@/domains/intake/lib/evidence";
import type { EvidenceRecord } from "@/domains/intake/types";
import { ArtifactContent } from "@/domains/jobs/components/artifact-content";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import { ActiveTabBody } from "@/shared/ui/active-tab-body";
import {
  ArtifactPreview,
  type ArtifactPreviewBody,
} from "@/shared/ui/artifact-preview";
import { DetailEmpty } from "@/shared/ui/detail-empty";
import { DetailFooter } from "@/shared/ui/detail-footer";
import { EmptyState } from "@/shared/ui/empty-state";
import type { EntityOption } from "@/shared/ui/entity-combobox";
import { ExternalUrl } from "@/shared/ui/external-url";
import { IdChip } from "@/shared/ui/id-chip";
import { MetaRow } from "@/shared/ui/meta-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { Tabs, TabsContent } from "@/shared/ui/shadcn/tabs";

type DetailTab = "content" | "output" | "jobs";

function noPreviewMessage(canEnrich: boolean, hasUri: boolean) {
  if (canEnrich) {
    return "URL dumps are link metadata until Enrich. Open the Output tab after Enrich finishes.";
  }
  return hasUri
    ? "Download the blob to inspect this file."
    : "This Evidence has no stored body yet.";
}

export interface EvidenceDetailProps {
  evidence: EvidenceRecord | null;
  caseId: string;
  jobs: JobListRecord[];
  entityName?: string | null;
  entities?: readonly EntityOption[];
  allowThirdPartyEgress?: boolean;
  actions: IntakeEvidenceActions;
}

function EvidenceOutputTab({
  enrichPending,
  enrichOutput,
}: {
  enrichPending: boolean;
  enrichOutput: ReturnType<typeof latestEnrichOutput>;
}) {
  if (enrichPending && !enrichOutput) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-xs">
        <Spinner className="size-3.5" />
        Enrich running — combined markdown appears here when done.
      </div>
    );
  }
  if (enrichOutput) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-xs">
          Combined live + Wayback from Enrich · Job{" "}
          <IdChip value={enrichOutput.job.id} copyable />
          {enrichOutput.artifact.name === ENRICHED_MD_ARTIFACT
            ? null
            : ` · fallback ${enrichOutput.artifact.name}`}
        </p>
        <ArtifactContent
          uri={enrichOutput.artifact.uri}
          mime={enrichOutput.artifact.mime}
          name={enrichOutput.artifact.name}
        />
      </div>
    );
  }
  return (
    <EmptyState
      intent="blank-slate"
      items="enrich output"
      title="No Enrich output yet"
      description="Run Enrich to fetch live + Wayback. Result stays on this dump (Output) — not a new Intake row. Then Harvest reads from it."
      className="py-6"
    />
  );
}

function EvidenceJobsTab({
  relatedJobs,
  canEnrich,
}: {
  relatedJobs: JobListRecord[];
  canEnrich: boolean;
}) {
  if (relatedJobs.length === 0) {
    return (
      <EmptyState
        intent="blank-slate"
        items="Cap runs"
        title="No Cap runs"
        description={
          canEnrich
            ? "Enrich writes Job output (see Output tab). Harvest / Extract propose identifiers into Inbox when an Entity is attached."
            : "Harvest (deterministic) or Extract (AI) propose identifiers from Evidence text. Analyze file / Analyze EML run from Jobs — they are not Harvest. With an Entity attached, candidates land in Inbox."
        }
        className="py-6"
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {relatedJobs.map((job, i) => {
        const live = job.status === "queued" || job.status === "running";
        return (
          <ProcessRunCard
            key={job.id}
            job={job}
            defaultOpen={live || i === 0}
          />
        );
      })}
    </div>
  );
}

type JsonParseResult = { ok: true; data: unknown } | { ok: false };

function tryParseJson(text: string): JsonParseResult {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function evidenceContentBody({
  canEnrich,
  isImage,
  downloadUrl,
  loadingBlob,
  resolvedText,
  mime,
  title,
  hasUri,
}: {
  canEnrich: boolean;
  isImage: boolean;
  downloadUrl: string | null;
  loadingBlob: boolean;
  resolvedText: string | null;
  mime: string | null;
  title: string;
  hasUri: boolean;
}): ArtifactPreviewBody {
  if (loadingBlob) return { kind: "loading" };

  if (isImage && downloadUrl !== null && downloadUrl !== "") {
    return {
      kind: "custom",
      children: (
        <img
          src={downloadUrl}
          alt={title}
          className="border-border max-w-full rounded-md border"
        />
      ),
    };
  }

  if (resolvedText !== null && resolvedText !== "") {
    const resolvedMime = mime ?? "text/plain";
    if (resolvedMime.includes("json")) {
      const parsed = tryParseJson(resolvedText);
      if (parsed.ok) {
        return { kind: "json", data: parsed.data, defaultExpanded: 2 };
      }
      return { kind: "text", code: resolvedText, mime: "text/plain" };
    }
    return { kind: "text", code: resolvedText, mime: resolvedMime };
  }

  return {
    kind: "custom",
    children: (
      <EmptyState
        intent="blank-slate"
        items="preview"
        title="No inline preview"
        description={noPreviewMessage(canEnrich, hasUri)}
        className="py-4"
      />
    ),
  };
}

function EvidenceContentPanel({
  evidence,
  canEnrich,
  isImage,
  downloadUrl,
  loadingBlob,
  resolvedText,
  hasUri,
}: {
  evidence: EvidenceRecord;
  canEnrich: boolean;
  isImage: boolean;
  downloadUrl: string | null;
  loadingBlob: boolean;
  resolvedText: string | null;
  hasUri: boolean;
}) {
  const title = evidenceTitle(evidence);

  return (
    <ArtifactPreview
      name={title}
      defaultOpen
      headerAction={
        evidence.sha256 !== null && evidence.sha256 !== "" ? (
          <IdChip
            value={evidence.sha256}
            preset="sha256"
            copyable
            className="min-w-0"
          />
        ) : undefined
      }
      meta={
        evidence.sourceUrl !== null && evidence.sourceUrl !== "" ? (
          <MetaRow
            label="Source URL"
            className="flex-col items-start gap-1"
            labelClassName="text-xs font-medium"
          >
            <ExternalUrl href={evidence.sourceUrl} />
          </MetaRow>
        ) : undefined
      }
      body={evidenceContentBody({
        canEnrich,
        isImage,
        downloadUrl,
        loadingBlob,
        resolvedText,
        mime: evidence.mime,
        title,
        hasUri,
      })}
    />
  );
}

export function EvidenceDetail({
  evidence,
  caseId,
  jobs,
  entityName,
  entities,
  allowThirdPartyEgress = false,
  actions,
}: EvidenceDetailProps) {
  // Callers remount this component with `key={evidence.id}` on selection
  // change, so this only needs to compute the initial tab once per evidence.
  const [tab, setTab] = useState<DetailTab>(() => {
    if (!evidence) return "content";
    if (latestEnrichOutput(jobs, evidence.id) !== null) return "output";
    const hasJobs =
      processJobsForEvidence(jobs, evidence.id).length > 0 ||
      enrichJobsForEvidence(jobs, evidence.id).length > 0;
    return hasJobs ? "jobs" : "content";
  });
  const [hideOpen, setHideOpen] = useState(false);
  const isHidden = Boolean(evidence?.deletedAt);

  const processJobs = useMemo(
    () => (evidence ? processJobsForEvidence(jobs, evidence.id) : []),
    [evidence, jobs]
  );
  const enrichJobs = useMemo(
    () => (evidence ? enrichJobsForEvidence(jobs, evidence.id) : []),
    [evidence, jobs]
  );
  const enrichOutput = useMemo(
    () => (evidence ? latestEnrichOutput(jobs, evidence.id) : null),
    [evidence, jobs]
  );
  const enrichPending = useMemo(
    () =>
      enrichJobs.some((j) => j.status === "queued" || j.status === "running"),
    [enrichJobs]
  );
  const canEnrich = Boolean(evidence && evidenceHasEnrichableUrl(evidence));
  const producingCap = useMemo(
    () => (evidence ? producingCapJob(jobs, evidence.id) : null),
    [evidence, jobs]
  );
  const relatedJobs = useMemo(() => {
    const fromCap = producingCap === null ? [] : [producingCap];
    const ids = new Set(fromCap.map((j) => j.id));
    const rest = [...enrichJobs, ...processJobs].filter((j) => !ids.has(j.id));
    return [...fromCap, ...rest].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }, [producingCap, enrichJobs, processJobs]);

  const {
    isImage,
    downloadUrl,
    loadingUrl,
    resolvedText,
    loadingBlob,
    hasUri,
  } = useEvidenceBlob(caseId, evidence);

  function handleAttachEntity(entityId: string) {
    actions.onAttachEntity(entityId);
  }

  if (!evidence) {
    return (
      <DetailEmpty
        title="Select evidence"
        description="Choose a dump from the queue to view content, Enrich output, and Cap jobs."
      />
    );
  }

  const processed = Boolean(evidence.processedAt);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (typeof v !== "string") return;
          if (v === "content" || v === "output" || v === "jobs") setTab(v);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <EvidenceDetailHeader
          evidence={evidence}
          isHidden={isHidden}
          processed={processed}
          producingCap={producingCap}
          entityName={entityName}
          entities={entities}
          canEnrich={canEnrich}
          enrichJobs={enrichJobs}
          enrichOutput={enrichOutput}
          relatedJobs={relatedJobs}
          attaching={actions.attaching}
          onAttachEntity={handleAttachEntity}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TabsContent value="content" className="mt-0">
            <ActiveTabBody active={tab === "content"}>
              <EvidenceContentPanel
                evidence={evidence}
                canEnrich={canEnrich}
                isImage={isImage}
                downloadUrl={downloadUrl}
                loadingBlob={loadingBlob}
                resolvedText={resolvedText}
                hasUri={hasUri}
              />
            </ActiveTabBody>
          </TabsContent>

          <TabsContent value="output" className="mt-0">
            <ActiveTabBody active={tab === "output"}>
              <EvidenceOutputTab
                enrichPending={enrichPending}
                enrichOutput={enrichOutput}
              />
            </ActiveTabBody>
          </TabsContent>

          <TabsContent value="jobs" className="mt-0">
            <ActiveTabBody active={tab === "jobs"}>
              <EvidenceJobsTab
                relatedJobs={relatedJobs}
                canEnrich={canEnrich}
              />
            </ActiveTabBody>
          </TabsContent>
        </div>
      </Tabs>

      <DetailFooter
        leading={
          !isHidden && evidence.uri !== null && evidence.uri !== "" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              disabled={
                loadingUrl || downloadUrl === null || downloadUrl === ""
              }
              onClick={() => {
                if (downloadUrl !== null && downloadUrl !== "")
                  window.open(downloadUrl, "_blank");
              }}
            >
              <DownloadIcon className="size-3.5" data-icon="inline-start" />
              {loadingUrl ? "Loading…" : "Download"}
            </Button>
          ) : null
        }
      >
        <EvidenceHeaderActions
          isHidden={isHidden}
          actions={actions}
          canEnrich={canEnrich}
          processed={processed}
          allowThirdPartyEgress={allowThirdPartyEgress}
          onHideRequested={() => {
            setHideOpen(true);
          }}
        />
      </DetailFooter>

      <AlertDialog open={hideOpen} onOpenChange={setHideOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this dump from the active queue. It stays in the Case —
              open Filters → Hidden to restore it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHideOpen(false);
                actions.onHide();
              }}
            >
              Hide
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
