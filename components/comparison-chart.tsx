import { useState } from "react";
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
import { Button } from "./ui/button";

type Props = {
  user1: UserResult;
  user2: UserResult;
};

type ScoreMode = "overall" | "language";

const metrics = [
  { key: "repo", label: "comparsion.repo.score" },
  { key: "pr", label: "comparsion.pr.score" },
  { key: "contribution", label: "comparsion.contribution.score" },
  { key: "final", label: "comparsion.final.score" },
] as const;

function toChartScores(user: UserResult, mode: ScoreMode) {
  if (mode === "language" && user.languageScores) {
    return {
      repo: user.languageScores.normalizedRepoScore ?? user.languageScores.repoScore,
      pr: user.languageScores.normalizedPRScore ?? user.languageScores.prScore,
      contribution:
        user.languageScores.normalizedContributionScore ??
        user.languageScores.contributionScore,
      final: user.languageScores.normalizedFinalScore ?? user.languageScores.finalScore,
    };
  }

  return {
    repo: user.normalizedRepoScore ?? user.repoScore,
    pr: user.normalizedPRScore ?? user.prScore,
    contribution: user.normalizedContributionScore ?? user.contributionScore,
    final: user.normalizedFinalScore ?? user.finalScore,
  };
}

export function ComparisonChart({ user1, user2 }: Props) {
  const { t, dir } = useTranslation();
  const isRtl = dir === "rtl";
  const hasLanguageMode = Boolean(user1.languageScores && user2.languageScores);
  const [mode, setMode] = useState<ScoreMode>("overall");
  const activeMode = hasLanguageMode ? mode : "overall";

  const user1Scores = toChartScores(user1, activeMode);
  const user2Scores = toChartScores(user2, activeMode);

  const data = metrics.map((metric) => ({
    name: t(metric.label),
    [user1.username]: user1Scores[metric.key],
    [user2.username]: user2Scores[metric.key],
  }));
  const user1DisplayName = user1.name?.trim() || user1.username;
  const user2DisplayName = user2.name?.trim() || user2.username;
  const displayNameByDataKey: Record<string, string> = {
    [user1.username]: user1DisplayName,
    [user2.username]: user2DisplayName,
  };

  const renderLegendText = (value: string) => (
    <span className="ms-2">{displayNameByDataKey[value] ?? value}</span>
  );
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
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("barchart.title")}
          </CardTitle>
          {hasLanguageMode ? (
            <div className="inline-flex rounded-lg border border-border p-1">
              <Button
                type="button"
                size="sm"
                variant={activeMode === "overall" ? "primary" : "ghost"}
                onClick={() => setMode("overall")}
                aria-label={t("chart.mode.overall")}
              >
                {t("chart.mode.overall")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeMode === "language" ? "primary" : "ghost"}
                onClick={() => setMode("language")}
                aria-label={t("chart.mode.language")}
              >
                {t("chart.mode.language")}
              </Button>
            </div>
          ) : null}
        </div>
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
              <XAxis dataKey="name" className="text-xs" reversed={isRtl} tickMargin={10} />
              <YAxis
                className="text-xs"
                orientation={isRtl ? "right" : "left"}
                tick={renderYAxisTick}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.45)" }}
                formatter={(value, name) => [
                  value,
                  displayNameByDataKey[String(name)] ?? String(name),
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--card-foreground))",
                  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
                  textAlign: isRtl ? "right" : "left",
                }}
              />
              <Legend formatter={renderLegendText} wrapperStyle={{ direction: dir }} />
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
