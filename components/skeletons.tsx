import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
