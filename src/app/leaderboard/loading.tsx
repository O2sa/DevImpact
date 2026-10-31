import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        {/* Leaderboard hero */}
        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-9 shadow-sm">
          <Skeleton className="h-3 w-40" />

          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-full max-w-2xl" />
            <Skeleton className="h-8 w-56 max-w-full" />
          </div>

          <div className="mt-6 space-y-1">
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>

          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        </section>

        {/* Country leaderboard container */}
        <section className="rounded-xl border border-border/60 bg-card p-6 sm:p-8">
          {/* Section heading */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          {/* Worldwide leaderboard link */}
          <div className="mt-10 flex items-center gap-4 rounded-xl border border-primary/30 bg-background p-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </div>
          </div>

          {/* Country search */}
          <Skeleton className="mt-5 h-8 w-full max-w-[21rem] rounded-md" />

          {/* Country cards */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 25 }).map((_, index) => (
              <div
                key={index}
                className="flex min-h-[52px] items-center rounded-lg border border-border/60 bg-background p-2.5"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3 shrink-0 rounded-sm" />
                    <Skeleton className="h-3.5 w-24 max-w-full" />
                  </div>

                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 shrink-0" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AppFooter />
    </main>
  );
}
