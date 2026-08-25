import { ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** External link with a leading `ExternalLink` icon — opens in a new tab. */
export function ExternalUrl({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-primary flex items-center gap-1 text-xs break-all hover:underline",
        className
      )}
    >
      <ExternalLinkIcon className="size-3 shrink-0" />
      {href}
    </a>
  );
}
