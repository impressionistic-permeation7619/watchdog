// @ts-nocheck — shadcn vendor; excluded from project checks
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { Children, isValidElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted rounded-lg p-[3px]",
        line: "gap-1 rounded-none bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function isTabCountChild(child: ReactNode): boolean {
  return (
    isValidElement(child) &&
    typeof child.type !== "string" &&
    (child.type as { displayName?: string }).displayName === "TabCount"
  );
}

function TabsTrigger({ className, children, ...props }: TabsPrimitive.Tab.Props) {
  const items = Children.toArray(children);
  const labelKids = items.filter((child) => !isTabCountChild(child));
  const countKids = items.filter((child) => isTabCountChild(child));

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "group/tabs-trigger text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 px-1.5 py-0.5 text-sm font-medium whitespace-nowrap transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // default = pill on muted track
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:text-foreground dark:group-data-[variant=default]/tabs-list:data-active:border-input dark:group-data-[variant=default]/tabs-list:data-active:bg-input/30 dark:group-data-[variant=default]/tabs-list:data-active:text-foreground rounded-md border border-transparent focus-visible:ring-[3px] focus-visible:outline-1 group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        // line = underline only (no border, fill, or outline box)
        "group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:shadow-none group-data-[variant=line]/tabs-list:ring-0 group-data-[variant=line]/tabs-list:outline-none group-data-[variant=line]/tabs-list:focus-visible:border-0 group-data-[variant=line]/tabs-list:focus-visible:ring-0 group-data-[variant=line]/tabs-list:focus-visible:outline-none group-data-[variant=line]/tabs-list:data-active:border-0 group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-none dark:group-data-[variant=line]/tabs-list:data-active:border-0 dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        className
      )}
      {...props}
    >
      <span
        data-slot="tabs-trigger-label"
        className={cn(
          "relative inline-flex items-center gap-1.5",
          "after:pointer-events-none after:absolute after:bg-foreground after:opacity-0 after:transition-opacity after:content-['']",
          "group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-px",
          "group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-px",
          "group-data-[variant=line]/tabs-list:group-data-active/tabs-trigger:after:opacity-100"
        )}
      >
        {labelKids}
        {countKids}
      </span>
    </TabsPrimitive.Tab>
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
