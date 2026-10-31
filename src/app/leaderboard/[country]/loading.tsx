import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CountryLeaderboardLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>

        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-8 shadow-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-9 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-md" />
        </section>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="mt-2 h-10 w-full max-w-sm rounded-md" />
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <th key={index} className="px-4 py-3 text-left">
                        <Skeleton className="h-4 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-b last:border-0">
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-6" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                      </td>
                      {Array.from({ length: 4 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4">
                          <Skeleton className="h-4 w-12" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AppFooter />
    </main>
  );
}
