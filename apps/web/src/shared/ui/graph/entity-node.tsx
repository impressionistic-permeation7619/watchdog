import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { MoreHorizontalIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { kindBorder } from "@/shared/ui/graph/graph-styles";
import type { EntityFlowNode } from "@/shared/ui/graph/types";
import { Button } from "@/shared/ui/shadcn/button";
import { KindBadge } from "@/shared/ui/vocab";

type Props = NodeProps<EntityFlowNode>;

const handleClass = "!size-2 !border-transparent !bg-transparent !opacity-0";

export function EntityNode({ data, selected }: Props) {
  const border = kindBorder(data.kind);
  const showMenu = data.showMenu === true;

  return (
    <div
      className={cn(
        "bg-card relative max-w-[14rem] min-w-[9rem] rounded-lg border-2 px-2.5 py-2 shadow-sm",
        selected && "ring-ring ring-offset-background ring-2 ring-offset-1",
        data.isCenter && "shadow-md"
      )}
      style={{ borderColor: border }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="t-top"
        className={handleClass}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="t-right"
        className={handleClass}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="t-bottom"
        className={handleClass}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="t-left"
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="s-top"
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="s-left"
        className={handleClass}
      />

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm leading-snug font-medium">
            {data.label}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <KindBadge kind={data.kind} className="text-chip" />
          </div>
        </div>
        {showMenu ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="nodrag nopan size-6 shrink-0"
            aria-label="Node actions"
            data-entity-menu=""
          >
            <MoreHorizontalIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
