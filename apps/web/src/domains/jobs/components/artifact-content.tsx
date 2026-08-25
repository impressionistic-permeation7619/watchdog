import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { artifactContentQuery } from "@/domains/jobs/queries";
import {
  ARTIFACT_LOADING,
  artifactBodyFromContent,
} from "@/shared/ui/artifact-body-from-content";
import { ArtifactPreview } from "@/shared/ui/artifact-preview";
import { IdChip } from "@/shared/ui/id-chip";

interface ArtifactContentProps {
  uri: string;
  mime: string;
  name: string;
  /** When set, shows a sha256 IdChip in the artifact header. */
  sha256?: string;
  className?: string;
  headerAction?: ReactNode;
  /** Forwarded to ArtifactPreview — start open or collapsed. */
  defaultOpen?: boolean;
}

/**
 * Fetches artifact bytes via Query + `getArtifactContentFn`.
 * Shared by Jobs + Intake Detail.
 */
export function ArtifactContent({
  uri,
  mime,
  name,
  sha256,
  className,
  headerAction,
  defaultOpen,
}: ArtifactContentProps) {
  const { data, isPending, isError } = useQuery(
    artifactContentQuery(uri, mime)
  );

  let content: string | null | typeof ARTIFACT_LOADING;
  if (isPending) {
    content = ARTIFACT_LOADING;
  } else if (isError) {
    content = null;
  } else {
    content = data?.text ?? null;
  }

  const shaChip =
    sha256 !== undefined && sha256 !== "" ? (
      <IdChip value={sha256} preset="sha256" copyable className="min-w-0" />
    ) : null;

  return (
    <ArtifactPreview
      name={name}
      mime={mime}
      className={className}
      defaultOpen={defaultOpen}
      headerAction={headerAction ?? shaChip ?? undefined}
      body={artifactBodyFromContent(content, mime)}
    />
  );
}
