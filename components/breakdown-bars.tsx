import { UserResult } from "@/types/user-result";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";


type Props = {
  user1: UserResult;
  user2: UserResult;
};

export function BreakdownBars({ user1, user2 }: Props) {
  const getMaxScore = (score1: number, score2: number) => Math.max(score1, score2, 1)


  return (
         <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
                <CardDescription>Progress bars showing relative performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {["repoScore", "prScore", "contributionScore"].map((metric) => {
                  const user1Value = user1[metric as keyof UserResult] as number
                  const user2Value = user2[metric as keyof UserResult] as number
                  const maxVal = getMaxScore(user1Value, user2Value)
                  const metricLabel = metric === "repoScore" ? "Repository Score" : metric === "prScore" ? "Pull Request Score" : "Contribution Score"
                  return (
                    <div key={metric} className="space-y-2 pe-2">
                      <div className="flex justify-between text-sm">
                        <span>{metricLabel}</span>
                        <span className="text-muted-foreground">
                          {user1.username}: {user1Value} | {user2.username}: {user2Value}
                        </span>
                      </div>
                      <div className="space-y-1 ">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-24 truncate">{user1.username}</span>
                          <Progress value={(user1Value / maxVal) * 100} className="flex-1 h-2" />
                          <span className="text-xs w-8">{user1Value}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-24 truncate">{user2.username}</span>
                          <Progress value={(user2Value / maxVal) * 100} className="flex-1 h-2" />
                          <span className="text-xs w-8">{user2Value}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
  );
}
