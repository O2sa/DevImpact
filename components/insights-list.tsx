import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useTranslation } from "./language-provider";
import { CompareInsights } from "@/types/api-response";
import type { UserResult } from "@/types/user-result";

type Props = {
  insights?: CompareInsights;
  user1?: UserResult;
  user2?: UserResult;
  user1Name?: string;
  user2Name?: string;
};

function getDisplayName(user?: UserResult, fallback?: string): string {
  if (fallback?.trim()) {
    return fallback;
  }

  if (!user) {
    return "";
  }

  const normalizedName = user.name?.trim();
  return normalizedName || user.username;
}

export function InsightsList({
  insights,
  user1,
  user2,
  user1Name,
  user2Name,
}: Props) {
  const { t } = useTranslation();

  if (!insights || !user1 || !user2) {
    return null;
  }

  const firstName = getDisplayName(user1, user1Name);
  const secondName = getDisplayName(user2, user2Name);

  const finalLeader = user1.finalScore >= user2.finalScore ? user1 : user2;
  const finalFollower = finalLeader.username === user1.username ? user2 : user1;
  const finalLeaderName = getDisplayName(finalLeader);
  const finalFollowerName = getDisplayName(finalFollower);
  const finalDiff = Math.abs(user1.finalScore - user2.finalScore);

  const repoLeader = user1.repoScore >= user2.repoScore ? user1 : user2;
  const prLeader = user1.prScore >= user2.prScore ? user1 : user2;
  const contributionLeader =
    user1.contributionScore >= user2.contributionScore ? user1 : user2;

  const user1Strengths: string[] = [];
  const user2Strengths: string[] = [];

  if (repoLeader.username === user1.username) {
    user1Strengths.push(t("insights.strength.repo"));
  } else {
    user2Strengths.push(t("insights.strength.repo"));
  }

  if (prLeader.username === user1.username) {
    user1Strengths.push(t("insights.strength.pr"));
  } else {
    user2Strengths.push(t("insights.strength.pr"));
  }

  if (contributionLeader.username === user1.username) {
    user1Strengths.push(t("insights.strength.contribution"));
  } else {
    user2Strengths.push(t("insights.strength.contribution"));
  }

  const buildRecommendations = (target: UserResult): string[] => {
    const recommendations: string[] = [];

    if (target.repoScore < repoLeader.repoScore) {
      recommendations.push(t("insights.recommendation.repo"));
    }

    if (target.prScore < prLeader.prScore) {
      recommendations.push(t("insights.recommendation.pr"));
    }

    if (target.contributionScore < contributionLeader.contributionScore) {
      recommendations.push(t("insights.recommendation.contribution"));
    }

    if (recommendations.length === 0) {
      recommendations.push(t("insights.recommendation.maintain"));
    }

    return recommendations;
  };

  const user1Recommendations = buildRecommendations(user1);
  const user2Recommendations = buildRecommendations(user2);

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t("insights.panelTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section>
          <h4 className="font-semibold">{t("insights.summary")}</h4>
          <p className="mt-1 text-muted-foreground">
            {t("insights.summaryText", {
              winner: finalLeaderName,
              diff: Math.round(finalDiff),
              other: finalFollowerName,
            })}
          </p>
        </section>

        <section>
          <h4 className="font-semibold">{t("insights.keyDifferences")}</h4>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
            <li>
              {t("insights.repo.leader", {
                username: getDisplayName(repoLeader),
                score: Math.round(repoLeader.repoScore),
                other: Math.round(
                  repoLeader.username === user1.username ? user2.repoScore : user1.repoScore,
                ),
              })}
            </li>
            <li>
              {t("insights.pr.leader", {
                username: getDisplayName(prLeader),
                score: Math.round(prLeader.prScore),
                other: Math.round(
                  prLeader.username === user1.username ? user2.prScore : user1.prScore,
                ),
              })}
            </li>
            <li>
              {t("insights.contribution.leaderDetailed", {
                username: getDisplayName(contributionLeader),
                score: Math.round(contributionLeader.contributionScore),
                other: Math.round(
                  contributionLeader.username === user1.username
                    ? user2.contributionScore
                    : user1.contributionScore,
                ),
              })}
            </li>
          </ul>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h4 className="font-semibold">{firstName || t("insights.user1Strengths")}</h4>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
              {(user1Strengths.length > 0 ? user1Strengths : [t("insights.strength.balanced")]).map(
                (item, index) => (
                <li key={`u1-strength-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="font-semibold">{secondName || t("insights.user2Strengths")}</h4>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
              {(user2Strengths.length > 0 ? user2Strengths : [t("insights.strength.balanced")]).map(
                (item, index) => (
                <li key={`u2-strength-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h4 className="font-semibold">
              {t("insights.recommendationsFor", { name: firstName || t("insights.user1Strengths") })}
            </h4>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
              {user1Recommendations.map((item, index) => (
                <li key={`u1-reco-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="font-semibold">
              {t("insights.recommendationsFor", { name: secondName || t("insights.user2Strengths") })}
            </h4>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-muted-foreground">
              {user2Recommendations.map((item, index) => (
                <li key={`u2-reco-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h4 className="font-semibold">{t("insights.confidenceNote")}</h4>
          <p className="mt-1 text-muted-foreground">
            {t("insights.confidenceNoteText", {
              user1: firstName,
              user2: secondName,
            })}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
