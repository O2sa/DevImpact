"use client";

import { useMemo, useState } from "react";
import { CompareForm } from "../components/compare-form";
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
      setError(err.message || "An unexpected error occurred. Please try again.");
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
       
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <CompareForm
          onSubmit={handleCompare}
          loading={loading}
          reset={reset}
          swapUsers={swapUsers}
          data={data}
          error={error}
        />

        {loading && skeleton}
        {data && <ResultDashboard user1={data.user1} user2={data.user2} />}
      </div>
    </main>
  );
}
