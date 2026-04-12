import {
  Eye,
  GitFork,
  GitPullRequest,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { UserResult } from "@/types/user-result";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  userResults: UserResult[];
};

export function TopList({ userResults }: Props) {
  const cardDetails = (data: {
    title: string;
    url?: string;
    subtitle?: string;
    score?: number;
    badges: { tooltip?: string; label?: any; icon: any }[];
    key: string | number;
  }) => (
    <div
      className="rounded-lg border p-3 transition-all hover:bg-muted/50 flex items-center justify-between"
      key={data.key}
    >
      <div>
        <div className="font-medium text-slate-900">
          {data.url ? (
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {data.title}
            </a>
          ) : (
            data.title
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {data.subtitle}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
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
        <p className="text-sm font-semibold text-slate-900">
          {(data.score ?? 0).toFixed(2)}
        </p>
        <p className="text-[11px] text-slate-500">Score</p>
      </div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {userResults.map((user) => (
        <Card key={`top-${user.username}`}>
          <CardHeader>
            <CardTitle className="text-lg">
              Top Work • {user.username}
            </CardTitle>
            <CardDescription>
              Most impactful repositories and pull requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Top Repos */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                <Star className="h-4 w-4" /> Top Repositories
              </h4>
              <div className="space-y-3">
                {user.topRepos.slice(0, 3).map((repo, i) =>
                  cardDetails({
                    key: `repo-${i}`,
                    title: repo.name || "Unknown Repository",
                    score: repo.score,
                    badges: [
                      {
                        icon: <Star className="h-4 w-4" />,
                        label: repo.stars,
                        tooltip: `${repo.stars} stars`,
                      },
                      {
                        icon: <GitFork className="h-4 w-4" />,
                        label: repo.forks,
                        tooltip: `${repo.forks} forks`,
                      },
                      {
                        icon: <Eye className="h-4 w-4" />,
                        label: repo.watchers,
                        tooltip: `${repo.watchers} watchers`,
                      },
                    ],
                  }),
                )}
                {user.topRepos.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No repository data
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                <GitPullRequest className="h-4 w-4" /> Top Pull Requests
              </h4>
              <div className="space-y-3">
                {user.topPullRequests.slice(0, 3).map((pr, i) =>
                  cardDetails({
                    key: `pr-${i}`,
                    title: pr.title || "Untitled Pull Request",
                    url: pr.url,
                    subtitle: `in ${pr.repo}`,
                    score: pr.score,
                    badges: [
                      {
                        icon: <Star className="h-4 w-4" />,
                        label: pr.stars,
                        tooltip: `${pr.stars} stars on the PR's repository`,
                      },
        
                      {
                        icon: <Plus className="text-emerald-500" />,
                        label: pr.additions || "0",
                        tooltip: `+${pr.additions || 0} additions`,
                      },
                      {
                        icon: <Minus className="text-rose-500" />,
                        label: pr.deletions || "0",
                        tooltip: `-${pr.deletions || 0} deletions`,
                      },
                    ],
                  }),
                )}
                {user.topPullRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No pull request data
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
