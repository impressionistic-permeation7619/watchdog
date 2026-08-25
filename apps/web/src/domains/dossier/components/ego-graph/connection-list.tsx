import { Link } from "@tanstack/react-router";

import type { EdgeRecord } from "@/domains/entities/edges/edges.functions";
import { cn } from "@/lib/utils";
import { EntityMention } from "@/shared/ui/entity-mention";
import { RowActionsMenu } from "@/shared/ui/row-actions-menu";
import { DropdownMenuItem } from "@/shared/ui/shadcn/dropdown-menu";
import { ConfidenceBadge, predicateLabel } from "@/shared/ui/vocab";

function ConnectionRow({
  edge,
  onEdit,
  onRemove,
}: {
  edge: EdgeRecord;
  onEdit: (edge: EdgeRecord) => void;
  onRemove: (edgeId: string) => void;
}) {
  const peerLabel = edge.peerName || edge.peerId.slice(0, 8);

  return (
    <li className="group">
      <div className="hover:bg-muted/40 flex items-start gap-2 px-3 py-2.5 transition-colors">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground shrink-0 text-xs">
              {predicateLabel(edge.predicate, edge.direction)}
            </span>
            <EntityMention
              name={peerLabel}
              slug={edge.peerSlug}
              tab="connections"
              className="min-w-0"
            />
            <ConfidenceBadge
              confidence={edge.confidence}
              className="text-chip shrink-0"
            />
          </div>
          {edge.notes?.trim() ? (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {edge.notes}
            </p>
          ) : null}
        </div>

        <RowActionsMenu label={`Actions for ${peerLabel}`}>
          <DropdownMenuItem
            render={
              <Link
                to="/entities/$entitySlug"
                params={{ entitySlug: edge.peerSlug }}
                search={{ tab: "connections" }}
              />
            }
          >
            Open peer
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onEdit(edge);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              onRemove(edge.id);
            }}
          >
            Remove
          </DropdownMenuItem>
        </RowActionsMenu>
      </div>
    </li>
  );
}

function DirectionBlock({
  title,
  edges,
  onEdit,
  onRemove,
}: {
  title: string;
  edges: EdgeRecord[];
  onEdit: (edge: EdgeRecord) => void;
  onRemove: (edgeId: string) => void;
}) {
  if (edges.length === 0) {
    return null;
  }

  return (
    <li className="list-none">
      <div className="bg-muted/30 text-muted-foreground text-chip sticky top-0 z-10 border-b px-3 py-1.5 font-medium tracking-wide uppercase">
        <span className="flex items-center justify-between gap-2">
          {title}
          <span className="font-mono tabular-nums">{edges.length}</span>
        </span>
      </div>
      <ul className="divide-border divide-y">
        {edges.map((edge) => (
          <ConnectionRow
            key={edge.id}
            edge={edge}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </li>
  );
}

export function CompactConnectionList({
  outbound,
  inbound,
  onEdit,
  onRemove,
  className,
}: {
  outbound: EdgeRecord[];
  inbound: EdgeRecord[];
  onEdit: (edge: EdgeRecord) => void;
  onRemove: (edgeId: string) => void;
  className?: string;
}) {
  if (outbound.length === 0 && inbound.length === 0) {
    return null;
  }

  return (
    <ul
      className={cn(
        "border-border max-h-64 overflow-y-auto rounded-lg border",
        className
      )}
    >
      <DirectionBlock
        title="Outbound"
        edges={outbound}
        onEdit={onEdit}
        onRemove={onRemove}
      />
      <DirectionBlock
        title="Inbound"
        edges={inbound}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    </ul>
  );
}
