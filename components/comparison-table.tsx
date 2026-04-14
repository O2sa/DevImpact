import { UserResult } from "@/types/user-result";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useTranslation } from "./language-provider";

type ScoreRow = {
  label: string;
  key: "finalScore" | "repoScore" | "prScore" | "contributionScore";
};

const rows: ScoreRow[] = [
  { label: "result.table.final", key: "finalScore" },
  { label: "result.table.repo", key: "repoScore" },
  { label: "result.table.pr", key: "prScore" },
  { label: "result.table.contribution", key: "contributionScore" },
];

type ComparisonTableProps = {
  user1: UserResult;
  user2: UserResult;
};

export function ComparisonTable({ user1, user2 }: ComparisonTableProps) {
const {t} = useTranslation();
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {[user1, user2].map((user, idx) => (
        <Card key={user.username} className="overflow-hidden transition-all hover:shadow-lg">
          <CardHeader className={user.isWinner ? "border-b-2 border-primary/30" : "border-b-2 border-muted"}>
            <CardTitle className="flex items-center justify-between">
              <span>{user.username}</span>
              {user.isWinner && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Winner</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">{t("comparsion.final.score")}</span>
              <span className="text-2xl font-bold">{user.finalScore}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("comparsion.repo.score")}</span>
              <span className={`font-semibold ${user.repoScore > (idx === 0 ? user2.repoScore : user1.repoScore) ? "text-primary" : ""}`}>
                {user.repoScore}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("comparsion.pr.score")}</span>
              <span className={`font-semibold ${user.prScore > (idx === 0 ? user2.prScore : user1.prScore) ? "text-primary" : ""}`}>
                {user.prScore}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("comparsion.contribution.score")}</span>
              <span className={`font-semibold ${user.contributionScore > (idx === 0 ? user2.contributionScore : user1.contributionScore) ? "text-primary" : ""}`}>
                {user.contributionScore}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
