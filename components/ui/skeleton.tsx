import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-[hsl(var(--muted-foreground)/0.12)] dark:bg-[hsl(var(--muted)/1)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
