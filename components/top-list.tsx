import { type ReactNode } from "react";
import { Eye, GitFork, GitPullRequest, Minus, Plus, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { UserResult } from "@/types/user-result";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "./language-provider";

type Props = {
  userResults: UserResult[];
};

export function TopList({ userResults }: Props) {
  const { t } = useTranslation();

  const cardDetails = (data: {
    title: string;
    titleUrl?: string;
    subtitle?: string;
    score?: number;
    badges: { tooltip?: string; label?: ReactNode; icon: ReactNode }[];
    key: string | number;
  }) => (
    <div
      className="flex items-center justify-between rounded-lg border border-border p-3 transition-all hover:bg-muted/50"
      key={data.key}
    >
      <div>
        <div className="font-medium text-foreground">
          {data.titleUrl ? (
            <a
              href={data.titleUrl}
              title="Open on GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {data.title}
            </a>
          ) : (
            data.title
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {data.subtitle}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          {data.badges.map((badge, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  {badge.icon} {badge.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">
          {data.score ?? 0}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t("comparsion.score")}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {userResults.map((user) => (
        <Card key={`top-${user.username}`}>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("topwork.titleForUser", { username: user.name || user.username })}
            </CardTitle>
            <CardDescription>{t("topwork.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4" /> {t("topwork.toprepos")}
              </h4>
              <div className="space-y-3">
                {user.topRepos.slice(0, 3).map((repo, i) =>
                  cardDetails({
                    key: `repo-${i}`,
                    title: repo.name || t("untitled"),
                    titleUrl: repo.name
                      ? `https://github.com/${user.username}/${repo.name}`
                      : undefined,
                    score: repo.score,
                    badges: [
                      {
                        icon: <Star className="h-4 w-4" />,
                        label: repo.stars,
                        tooltip: `${repo.stars} ${t("topwork.stars")}`,
                      },
                      {
                        icon: <GitFork className="h-4 w-4" />,
                        label: repo.forks,
                        tooltip: `${repo.forks} ${t("topwork.forks")}`,
                      },
                      {
                        icon: <Eye className="h-4 w-4" />,
                        label: repo.watchers,
                        tooltip: `${repo.watchers} ${t("topwork.watchers")}`,
                      },
                    ],
                  }),
                )}
                {user.topRepos.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("topwork.noRepos")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <GitPullRequest className="h-4 w-4" /> {t("topwork.topprs")}
              </h4>
              <div className="space-y-3">
                {user.topPullRequests.slice(0, 3).map((pr, i) =>
                  cardDetails({
                    key: `pr-${i}`,
                    title: pr.title || t("untitled"),
                    titleUrl: pr.url,
                    subtitle: t("topwork.inRepo", { repo: pr.repo || "" }),
                    score: pr.score,
                    badges: [
                      {
                        icon: <Star className="h-4 w-4" />,
                        label: pr.stars,
                        tooltip: `${pr.stars} ${t("topwork.pr.repo.stars")}`,
                      },
                      {
                        icon: <Plus className="text-emerald-500" />,
                        label: pr.additions || "0",
                        tooltip: `+${pr.additions || 0} ${t("topwork.pr.additions")}`,
                      },
                      {
                        icon: <Minus className="text-rose-500" />,
                        label: pr.deletions || "0",
                        tooltip: `-${pr.deletions || 0} ${t("topwork.pr.deletions")}`,
                      },
                    ],
                  }),
                )}
                {user.topPullRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("topwork.noPRs")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
