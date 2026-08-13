import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-6 w-48 rounded-md" />
                <Skeleton className="mt-2 h-5 w-36 rounded-md" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="mt-2 h-8 w-32 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 rounded-xl" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 rounded-xl" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Skeleton className="h-5 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 rounded-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
