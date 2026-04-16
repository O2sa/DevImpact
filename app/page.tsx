"use client";

import { useMemo, useState } from "react";
import { CompareForm } from "../components/compare-form";
import { ResultDashboard } from "../components/result-dashboard";
import { DashboardSkeleton } from "../components/skeletons";
import { UserResult } from "@/types/user-result";
import { BrandLogo } from "@/components/brand-logo";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { useTranslation } from "@/components/language-provider";

type ApiResponse = {
  success: boolean;
  users?: UserResult[];
  error?: string;
};

export default function HomePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    user1: UserResult;
    user2: UserResult;
  } | null>(null);

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

  const skeleton = useMemo(() => <DashboardSkeleton />, []);

  const reset = () => {
    setData(null);
    setError(null);
  };

  const swapUsers = () => {
    if (!data) return;
    setData((d) => ({ user1: d!.user2, user2: d!.user1 }));
  };

  return (
    <main className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-10 space-y-6">
        <CompareForm
          onSubmit={handleCompare}
          loading={loading}
          reset={reset}
          swapUsers={swapUsers}
          data={Boolean(data)}
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
