import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, notFound } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { useEffect } from "react";

import { casesContextQuery } from "@/domains/cases/queries";
import { ClaimsSection } from "@/domains/dossier/components/claims-section";
import { ConnectionsSection } from "@/domains/dossier/components/connections-section";
import { DisproveSection } from "@/domains/dossier/components/disprove-section";
import { DossierEditDialog } from "@/domains/dossier/components/dossier-edit-dialog";
import { DossierExportMenu } from "@/domains/dossier/components/dossier-export-menu";
import { EntityEvidenceSection } from "@/domains/dossier/components/entity-evidence-section";
import { EventsSection } from "@/domains/dossier/components/events-section";
import { EvidencePreviewDrawer } from "@/domains/dossier/components/evidence-preview-drawer";
import { IdentifiersSection } from "@/domains/dossier/components/identifiers-section";
import { QuestionsSection } from "@/domains/dossier/components/questions-section";
import {
  NotesSection,
  SummarySection,
} from "@/domains/dossier/components/summary-notes-section";
import { useDossierShell } from "@/domains/dossier/hooks/use-dossier-shell";
import { entityBySlugQuery } from "@/domains/entities/queries";
import type { EntityRecord } from "@/domains/entities/types";
import { DossierTasksSection } from "@/domains/tasks/components/dossier-tasks-section";
import { Page, PageHeader } from "@/shared/layout/page";
import { bindCasesChangedInvalidation } from "@/shared/lib/query-invalidation";
import { ActiveTabBody, SuspenseTabBody } from "@/shared/ui/active-tab-body";
import { EditableTextCell } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { TabCount } from "@/shared/ui/tab-count";
import { KindBadge } from "@/shared/ui/vocab";

type DossierTab =
  | "overview"
  | "notes"
  | "claims"
  | "identifiers"
  | "connections"
  | "evidence"
  | "events"
  | "questions"
  | "tasks";

const DOSSIER_TABS: readonly DossierTab[] = [
  "overview",
  "notes",
  "claims",
  "identifiers",
  "connections",
  "evidence",
  "events",
  "questions",
  "tasks",
] as const;

function isDossierTab(value: string): value is DossierTab {
  return (DOSSIER_TABS as readonly string[]).includes(value);
}

function parseDossierTab(value: string | undefined): DossierTab {
  if (value !== undefined && isDossierTab(value)) {
    return value;
  }
  return "overview";
}

function DossierForEntity({
  caseId,
  entity,
  tab,
  onTabChange,
}: {
  caseId: string;
  entity: EntityRecord;
  tab: DossierTab;
  onTabChange: (tab: DossierTab) => void;
}) {
  const {
    evidenceAll,
    evidencePending,
    previewEvidence,
    setPreviewEvidence,
    editOpen,
    setEditOpen,
    editError,
    setEditError,
    handleEvidenceClick,
    counts,
    renameMutation,
    editMutation,
  } = useDossierShell(caseId, entity);

  return (
    <Page density={tab === "tasks" || tab === "notes" ? "split" : "default"}>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          onTabChange(parseDossierTab(typeof v === "string" ? v : undefined));
        }}
        className="flex min-h-0 w-full flex-1 flex-col gap-4"
      >
        <PageHeader
          current={
            <span className="inline-flex min-w-0 items-center gap-2">
              <KindBadge kind={entity.kind} />
              <EditableTextCell
                value={entity.name}
                aria-label="Entity name"
                placeholder="Name…"
                disabled={renameMutation.isPending}
                className="focus-visible:border-border focus-visible:ring-ring/40 w-auto max-w-[min(28rem,50vw)] min-w-[6rem] border-transparent bg-transparent px-1.5 text-sm font-semibold tracking-tight shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-1 dark:bg-transparent"
                onCommit={(next) => {
                  const name = next.trim();
                  if (!name) return false;
                  if (name !== entity.name) {
                    renameMutation.mutate(name);
                  }
                  return true;
                }}
              />
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditError(null);
                  setEditOpen(true);
                }}
              >
                <PencilIcon className="size-3.5" />
                Edit
              </Button>
              <DossierExportMenu caseId={caseId} entitySlug={entity.slug} />
            </div>
          }
          below={
            <TabsList
              variant="line"
              className="h-8 max-w-full justify-start overflow-x-auto"
            >
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="claims">
                Claims
                <TabCount n={counts.claims} />
              </TabsTrigger>
              <TabsTrigger value="identifiers">
                Identifiers
                <TabCount n={counts.identifiers} />
              </TabsTrigger>
              <TabsTrigger value="connections">
                Connections
                <TabCount n={counts.connections} />
              </TabsTrigger>
              <TabsTrigger value="evidence">
                Evidence
                <TabCount n={counts.evidence} />
              </TabsTrigger>
              <TabsTrigger value="events">
                Events
                <TabCount n={counts.events} />
              </TabsTrigger>
              <TabsTrigger value="questions">
                Questions
                <TabCount n={counts.questions} />
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks
                <TabCount n={counts.tasks} />
              </TabsTrigger>
            </TabsList>
          }
        />

        <DossierEditDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditError(null);
          }}
          entity={entity}
          busy={editMutation.isPending}
          error={editError}
          onSubmit={async (values) => {
            setEditError(null);
            await editMutation.mutateAsync(values);
          }}
        />

        <TabsContent value="overview">
          <ActiveTabBody active={tab === "overview"}>
            <SuspenseTabBody>
              <div className="flex flex-col gap-6">
                <SummarySection
                  key={`${entity.id}:${entity.updatedAt}`}
                  caseId={caseId}
                  entity={entity}
                />
                <ClaimsSection
                  caseId={caseId}
                  entityId={entity.id}
                  entitySlug={entity.slug}
                  evidenceOptions={evidenceAll}
                  onEvidenceClick={handleEvidenceClick}
                />
                <IdentifiersSection
                  caseId={caseId}
                  entityId={entity.id}
                  entitySlug={entity.slug}
                  entity={entity}
                  evidenceOptions={evidenceAll}
                  onEvidenceClick={handleEvidenceClick}
                />
                <ConnectionsSection
                  caseId={caseId}
                  entityId={entity.id}
                  entitySlug={entity.slug}
                  entity={entity}
                  evidenceOptions={evidenceAll}
                  onEvidenceClick={handleEvidenceClick}
                />
                <DisproveSection caseId={caseId} entityId={entity.id} />
              </div>
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>

        <TabsContent
          value="notes"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ActiveTabBody active={tab === "notes"}>
            <NotesSection
              key={`${entity.id}:${entity.updatedAt}`}
              caseId={caseId}
              entity={entity}
            />
          </ActiveTabBody>
        </TabsContent>

        <TabsContent value="claims" className="flex flex-1 flex-col">
          <ActiveTabBody active={tab === "claims"}>
            <SuspenseTabBody>
              <div className="flex flex-1 flex-col gap-6">
                <ClaimsSection
                  caseId={caseId}
                  entityId={entity.id}
                  entitySlug={entity.slug}
                  evidenceOptions={evidenceAll}
                  onEvidenceClick={handleEvidenceClick}
                  emptyPresentation="panel"
                />
                <DisproveSection caseId={caseId} entityId={entity.id} />
              </div>
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>

        <TabsContent value="identifiers" className="flex flex-1 flex-col">
          <ActiveTabBody active={tab === "identifiers"}>
            <SuspenseTabBody>
              <IdentifiersSection
                caseId={caseId}
                entityId={entity.id}
                entitySlug={entity.slug}
                entity={entity}
                evidenceOptions={evidenceAll}
                onEvidenceClick={handleEvidenceClick}
                emptyPresentation="panel"
              />
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>

        <TabsContent value="connections" className="flex flex-1 flex-col">
          <ActiveTabBody active={tab === "connections"}>
            <SuspenseTabBody>
              <ConnectionsSection
                caseId={caseId}
                entityId={entity.id}
                entitySlug={entity.slug}
                entity={entity}
                evidenceOptions={evidenceAll}
                onEvidenceClick={handleEvidenceClick}
                emptyPresentation="panel"
                fillHeight
              />
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>

        <TabsContent value="evidence" className="flex flex-1 flex-col">
          <ActiveTabBody
            active={tab === "evidence"}
            pending={evidencePending}
            pendingSections={1}
          >
            <EntityEvidenceSection
              caseId={caseId}
              entityId={entity.id}
              evidenceOptions={evidenceAll}
              onEvidenceClick={handleEvidenceClick}
              emptyPresentation="panel"
            />
          </ActiveTabBody>
        </TabsContent>

        <TabsContent value="events" className="flex flex-1 flex-col">
          <ActiveTabBody active={tab === "events"}>
            <SuspenseTabBody>
              <EventsSection
                caseId={caseId}
                entityId={entity.id}
                entitySlug={entity.slug}
                emptyPresentation="panel"
              />
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>

        <TabsContent value="questions" className="flex flex-1 flex-col">
          <ActiveTabBody active={tab === "questions"}>
            <SuspenseTabBody>
              <QuestionsSection
                caseId={caseId}
                entityId={entity.id}
                entitySlug={entity.slug}
                emptyPresentation="panel"
              />
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>

        <TabsContent
          value="tasks"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ActiveTabBody active={tab === "tasks"}>
            <SuspenseTabBody>
              <DossierTasksSection
                caseId={caseId}
                entityId={entity.id}
                entitySlug={entity.slug}
              />
            </SuspenseTabBody>
          </ActiveTabBody>
        </TabsContent>
      </Tabs>

      <EvidencePreviewDrawer
        evidence={previewEvidence}
        caseId={caseId}
        onClose={() => {
          setPreviewEvidence(null);
        }}
      />
    </Page>
  );
}

function DossierForCase({
  caseId,
  caseName,
  entitySlug,
  tab,
  onTabChange,
}: {
  caseId: string;
  caseName: string;
  entitySlug: string;
  tab: DossierTab;
  onTabChange: (tab: DossierTab) => void;
}) {
  const { data: entity } = useSuspenseQuery(
    entityBySlugQuery(caseId, entitySlug)
  );
  if (entity === null) {
    // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router's notFound() throws a plain object, per docs
    throw notFound({ data: { caseName, entitySlug } });
  }

  return (
    <DossierForEntity
      caseId={caseId}
      entity={entity}
      tab={tab}
      onTabChange={onTabChange}
    />
  );
}

export function Dossier({
  entitySlug,
  tab: tabProp,
  onTabChange,
}: {
  entitySlug: string;
  tab?: string;
  onTabChange: (tab: DossierTab) => void;
}) {
  const queryClient = useQueryClient();
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());

  useEffect(() => bindCasesChangedInvalidation(queryClient), [queryClient]);

  if (!casesCtx.active) {
    return (
      <Page>
        <PageHeader />
        <Button nativeButton={false} render={<Link to="/cases" />}>
          Go to Cases
        </Button>
      </Page>
    );
  }

  return (
    <DossierForCase
      caseId={casesCtx.active.id}
      caseName={casesCtx.active.name}
      entitySlug={entitySlug}
      tab={parseDossierTab(tabProp)}
      onTabChange={onTabChange}
    />
  );
}
