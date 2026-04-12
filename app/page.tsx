"use client";

import { useMemo, useState } from "react";
import { CompareForm } from "../components/compare-form";
import { ThemeToggle } from "../components/theme-toggle";
import { ResultDashboard } from "../components/result-dashboard";
import { DashboardSkeleton } from "../components/skeletons";
import { UserResult } from "@/types/user-result";

type ApiResponse = {
  success: boolean;
  users?: UserResult[];
  error?: string;
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    user1: UserResult;
    user2: UserResult;
  } | null>(null);

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
        throw new Error(body.error || "Comparison failed");
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
    } catch (err: any) {
      setError(err.message || "Failed to fetch");
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
    console.log("Swapped users", data);
  };
  return (
    <main className="min-h-screen">
      {" "}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-7xl items-center justify-between m-auto px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              DevImpact
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <CompareForm
          onSubmit={handleCompare}
          loading={loading}
          reset={reset}
          swapUsers={swapUsers}
          data={data}
        />

        {loading && skeleton}
        {error && (
          <div className="card p-4 text-sm text-red-600 bg-red-50 border border-red-100">
            {error}
          </div>
        )}
        {data && <ResultDashboard user1={data.user1} user2={data.user2} />}
        {!loading && !error && !data && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-30"
            >
              <circle cx="9" cy="7" r="4" />
              <circle cx="15" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" />
            </svg>
            <p className="text-lg font-medium">Enter two usernames to compare</p>
            <p className="text-sm opacity-70">
              Compare GitHub developer metrics side by side
            </p>
          </div>
        )}
      </div>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4">
          <span className="font-medium">DevImpact</span> — Compare GitHub developer metrics
        </div>
      </footer>
    </main>
  );
}
