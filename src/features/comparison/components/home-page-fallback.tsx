import { Skeleton } from "@/components/ui";

export function HomePageFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
      <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
        <div className="space-y-4 pb-4">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md rounded-lg" />
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-11 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-11 rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
        <Skeleton className="h-6 w-64 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
    </div>
  );
}
