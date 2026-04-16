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
import { useTranslation } from "./language-provider";
import { useTranslation } from "./language-provider";

type Props = {
  user1: UserResult;
  user2: UserResult;
};

const metrics = [
  { key: "repoScore", label: "comparsion.repo.score" },
  { key: "prScore", label: "comparsion.pr.score" },
  { key: "contributionScore", label: "comparsion.activity.score" },
  { key: "repoScore", label: "comparsion.repo.score" },
  { key: "prScore", label: "comparsion.pr.score" },
  { key: "contributionScore", label: "comparsion.activity.score" },
];

export function ComparisonChart({ user1, user2 }: Props) {
  const { t, dir } = useTranslation();
  const isRtl = dir === "rtl";

  const data = metrics.map((m) => ({
    name: t(m.label),
    name: t(m.label),
    [user1.username]: user1[m.key as keyof UserResult] ?? 0,
    [user2.username]: user2[m.key as keyof UserResult] ?? 0,
  }));

  const renderLegendText = (value: string) => {
    return <span className="ms-2">{value}</span>;
  };
  const renderYAxisTick = ({
    x,
    y,
    payload,
  }: {
    x: number;
    y: number;
    payload: { value: number | string };
  }) => (
    <text
      x={x}
      y={y}
      dx={isRtl ? 28 : -8}
      textAnchor={isRtl ? "start" : "end"}
      dominantBaseline="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize={12}
    >
      {payload.value}
    </text>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t("barchart.title")}
        </CardTitle>
        <CardDescription>{t("barchart.desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80" dir={dir}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: isRtl ? 20 : 30,
                left: isRtl ? 30 : 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                reversed={isRtl}
                tickMargin={10}
              />
              <YAxis
                className="text-xs"
                orientation={isRtl ? "right" : "left"}
                tick={renderYAxisTick}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--card-foreground))",
                  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
                  textAlign: isRtl ? "right" : "left",
                }}
              />
              <Legend
                formatter={renderLegendText}
                wrapperStyle={{ direction: dir }}
              />
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
