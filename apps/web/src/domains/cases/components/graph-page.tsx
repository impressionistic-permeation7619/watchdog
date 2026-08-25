import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { CaseGraphCanvas } from "@/domains/cases/components/case-graph/case-graph-canvas";
import { casesContextQuery } from "@/domains/cases/queries";
import type { CaseRecord } from "@/domains/cases/types";
import { entitiesListQuery } from "@/domains/entities/queries";
import { Page, PageHeader } from "@/shared/layout/page";
import { Button } from "@/shared/ui/shadcn/button";

function GraphActive({ active }: { active: CaseRecord }) {
  const { data: entities } = useSuspenseQuery(entitiesListQuery(active.id));

  return (
    <Page density="split" className="gap-3">
      <PageHeader />
      <CaseGraphCanvas
        caseId={active.id}
        entities={entities}
        className="min-h-0 flex-1"
      />
    </Page>
  );
}

export function GraphPage() {
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());

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

  return <GraphActive active={casesCtx.active} />;
}
