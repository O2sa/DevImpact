import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="card p-6 animate-pulse space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
