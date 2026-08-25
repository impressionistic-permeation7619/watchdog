import { useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";

import { evidenceDownloadUrlQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import { ExternalUrl } from "@/shared/ui/external-url";
import { IdChip } from "@/shared/ui/id-chip";
import { MetaGrid, MetaGridItem, MetaRow } from "@/shared/ui/meta-row";
import { RelativeTime } from "@/shared/ui/relative-time";
import { Button } from "@/shared/ui/shadcn/button";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";
import { Separator } from "@/shared/ui/shadcn/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/shadcn/sheet";
import { KindBadge } from "@/shared/ui/vocab";

function EvidencePreviewBody({
  evidence,
  caseId,
}: {
  evidence: EvidenceRecord;
  caseId: string;
}) {
  const downloadQuery = useQuery({
    ...evidenceDownloadUrlQuery(caseId, evidence.id),
    enabled: Boolean(evidence.uri),
  });
  const downloadUrl = downloadQuery.data?.url ?? null;
  const loadingUrl = downloadQuery.isPending && Boolean(evidence.uri);

  const isImage = evidence.mime?.startsWith("image/") ?? false;
  // Pastes land as kind=file + text/plain; attestations are text-shaped too.
  // Structure-only: keep existing ?? chain (JSON mime bug is out of band).
  const isText =
    (evidence.kind === "attestation" || evidence.mime?.startsWith("text/")) ??
    evidence.mime === "application/json";

  const title =
    (evidence.label !== null && evidence.label !== ""
      ? evidence.label
      : undefined) ??
    (evidence.sourceUrl !== null && evidence.sourceUrl !== ""
      ? evidence.sourceUrl
      : undefined) ??
    "Untitled";

  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <KindBadge kind={evidence.kind} />
          {evidence.mime !== null && evidence.mime !== undefined ? (
            <span className="text-label-mono-sm text-muted-foreground">
              {evidence.mime}
            </span>
          ) : null}
        </div>
        <SheetTitle className="text-base">{title}</SheetTitle>
        {evidence.notes !== null && evidence.notes !== "" ? (
          <SheetDescription>{evidence.notes}</SheetDescription>
        ) : null}
      </SheetHeader>

      <Separator />

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="flex flex-col gap-4">
          <MetaGrid>
            <MetaGridItem label="Captured">
              <RelativeTime value={evidence.capturedAt} />
            </MetaGridItem>
            <MetaGridItem label="Processed">
              {evidence.processedAt !== null &&
              evidence.processedAt !== undefined ? (
                <RelativeTime
                  value={evidence.processedAt}
                  className="text-success"
                />
              ) : (
                <span className="text-warning">No</span>
              )}
            </MetaGridItem>
            {evidence.sha256 !== null && evidence.sha256 !== undefined ? (
              <MetaGridItem label="SHA-256">
                <IdChip value={evidence.sha256} preset="sha256" copyable />
              </MetaGridItem>
            ) : null}
          </MetaGrid>

          {evidence.sourceUrl !== null && evidence.sourceUrl !== undefined ? (
            <MetaRow
              label="Source URL"
              className="flex-col items-start gap-1"
              labelClassName="text-xs font-medium"
            >
              <ExternalUrl href={evidence.sourceUrl} />
            </MetaRow>
          ) : null}

          {isImage && downloadUrl !== null && downloadUrl !== "" ? (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-medium">
                Preview
              </span>
              <img
                src={downloadUrl}
                alt={evidence.label ?? "evidence"}
                className="max-w-full rounded-md border"
              />
            </div>
          ) : null}

          {isText &&
          evidence.text !== null &&
          evidence.text !== undefined &&
          evidence.text !== "" ? (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-medium">
                Content
              </span>
              <pre className="bg-muted max-h-64 overflow-y-auto rounded-md p-3 font-mono text-xs break-all whitespace-pre-wrap">
                {evidence.text}
              </pre>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {evidence.uri !== null && evidence.uri !== undefined ? (
        <>
          <Separator />
          <div className="flex justify-end gap-2 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                loadingUrl || downloadUrl === null || downloadUrl === ""
              }
              onClick={() => {
                if (downloadUrl !== null && downloadUrl !== "")
                  window.open(downloadUrl, "_blank");
              }}
            >
              <DownloadIcon className="size-3.5" />
              {loadingUrl ? "Loading…" : "Download"}
            </Button>
          </div>
        </>
      ) : null}
    </>
  );
}

export function EvidencePreviewDrawer({
  evidence,
  caseId,
  onClose,
}: {
  evidence: EvidenceRecord | null;
  caseId: string;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={evidence !== null}
      onOpenChange={(open) => {
        if (open) return;
        onClose();
      }}
    >
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
      >
        {evidence === null ? null : (
          <EvidencePreviewBody evidence={evidence} caseId={caseId} />
        )}
      </SheetContent>
    </Sheet>
  );
}
