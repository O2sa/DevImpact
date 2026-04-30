"use client";

import { Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareForm } from "../components/compare-form";
import { ResultDashboard } from "../components/result-dashboard";
import { DashboardSkeleton } from "../components/skeletons";
import { UserResult } from "@/types/user-result";
import { BrandLogo } from "@/components/brand-logo";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useTranslation } from "@/components/language-provider";
import { ApiResponse } from "@/types/api-response";

function HomePageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsernames = searchParams.getAll("username");
  const initialUsername1 = initialUsernames[0] ?? "";
  const initialUsername2 = initialUsernames[1] ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username1, setUsername1] = useState(initialUsername1);
  const [username2, setUsername2] = useState(initialUsername2);
  const [data, setData] = useState<{
    user1: UserResult;
    user2: UserResult;
  } | null>(null);
  // Track the URL pair we last fetched against so back/forward navigation
  // can resync the form and results without re-fetching identical pairs.
  const lastFetchedPairRef = useRef<[string, string] | null>(null);

  const localizeErrorMessage = (message?: string) => {
    switch (message) {
      case "provide at least one username param":
        return t("error.missingUsername");
      case "GitHub user not found":
        return t("error.userNotFound");
      case "Failed to calculate score":
        return t("error.calculateFailed");
      case "Comparison failed":
        return t("error.comparisonFailed");
      case "Failed to fetch":
        return t("error.fetchFailed");
      default:
        return message || t("error.generic");
    }
  };

  const handleCompare = async (u1: string, u2: string) => {
    lastFetchedPairRef.current = [u1, u2];
    router.push(
      `/?username=${encodeURIComponent(u1)}&username=${encodeURIComponent(u2)}`,
      { scroll: false }
    );
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const params = new URLSearchParams();
      params.append("username", u1);
      params.append("username", u2);

      const res = await fetch(`/api/compare?${params.toString()}`);
      const body: ApiResponse = await res.json();

      if (!body.success || !body.users || body.users.length < 2) {
        throw new Error(localizeErrorMessage(body.error || "Comparison failed"));
      }

      if (body.users[0].finalScore > body.users[1].finalScore) {
        setData({
          user1: { ...body.users[0], isWinner: true },
          user2: body.users[1],
        });
      } else if (body.users[1].finalScore > body.users[0].finalScore) {
        setData({
          user1: body.users[0],
          user2: { ...body.users[1], isWinner: true },
        });
      } else {
        setData({ user1: body.users[0], user2: body.users[1] });
      }
    } catch (err: unknown) {
      setError(localizeErrorMessage(err instanceof Error ? err.message : undefined));
    } finally {
      setLoading(false);
    }
  };

  // Resync form + results to whatever the URL says — handles initial mount
  // AND back/forward navigation. We fetch only when the URL pair differs from
  // the last pair we fetched, so no infinite loop with the router.push above.
  const syncToUrl = useEffectEvent((u1: string, u2: string) => {
    setUsername1(u1);
    setUsername2(u2);

    if (!u1 || !u2) {
      // Empty params: clear results so the empty state matches the URL.
      lastFetchedPairRef.current = null;
      setData(null);
      setError(null);
      return;
    }

    const last = lastFetchedPairRef.current;
    if (last && last[0] === u1 && last[1] === u2) {
      // URL already reflects the most recent fetch; nothing to do.
      return;
    }

    void handleCompare(u1, u2);
  });

  useEffect(() => {
    const params = searchParams.getAll("username");
    syncToUrl(params[0] ?? "", params[1] ?? "");
  }, [searchParams]);

  const skeleton = useMemo(() => <DashboardSkeleton />, []);

  const reset = () => {
    setData(null);
    setError(null);
    setUsername1("");
    setUsername2("");
    router.push("/", { scroll: false });
  };

  const swapUsers = () => {
    const nextUsername1 = username2;
    const nextUsername2 = username1;

    setUsername1(nextUsername1);
    setUsername2(nextUsername2);
    router.push(
      `/?username=${encodeURIComponent(nextUsername1)}&username=${encodeURIComponent(nextUsername2)}`,
      { scroll: false }
    );

    if (!data) return;
    setData((d) => ({ user1: d!.user2, user2: d!.user1 }));
  };

  return (
    <main className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-10 space-y-6">
        <CompareForm
          username1={username1}
          username2={username2}
          setUsername1={setUsername1}
          setUsername2={setUsername2}
          onSubmit={handleCompare}
          loading={loading}
          reset={reset}
          swapUsers={swapUsers}
          hasData={Boolean(data)}
        />

        {loading && skeleton}
        {error && (
          <div className="card border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {data && <ResultDashboard user1={data.user1} user2={data.user2} />}

        {!loading && !error && !data && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-muted-foreground">
            <BrandLogo size="xl" />
            <p className="text-lg font-medium">{t("page.empty.title")}</p>
            <p className="text-sm opacity-70">{t("page.empty.description")}</p>
          </div>
        )}
      </div>

      <AppFooter />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HomePageInner />
    </Suspense>
  );
}
