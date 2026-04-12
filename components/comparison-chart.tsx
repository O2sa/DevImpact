import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { BarChart3 } from "lucide-react";
import { UserResult } from "@/types/user-result";

type Props = {
  user1: UserResult;
  user2: UserResult;
};

const metrics = [
  { key: "repoScore", label: "Repos" },
  { key: "prScore", label: "PRs" },
  { key: "contributionScore", label: "Activity" },
];

export function ComparisonChart({ user1, user2 }: Props) {
  const data = metrics.map((m) => ({
    name: m.label,
    [user1.username]: user1[m.key as keyof UserResult] ?? 0,
    [user2.username]: user2[m.key as keyof UserResult] ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Score Comparison
        </CardTitle>
        <CardDescription>Visual breakdown of key metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar
                dataKey={user1.username}
                fill={user1.isWinner ? "#3b82f6" : "#22D3EE"}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey={user2.username}
                fill={user2.isWinner ? "#3b82f6" : "#22D3EE"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
