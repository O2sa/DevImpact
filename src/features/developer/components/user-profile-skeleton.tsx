import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UserProfileSkeleton() {
  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header Profile Skeleton */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-muted/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      {/* Score Distribution Bars Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <Skeleton className="h-5 w-44" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
        </CardContent>
      </Card>

      {/* Top Work Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-36" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-36" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-36" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
