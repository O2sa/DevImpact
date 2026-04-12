import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Props = {
  insights: string[];
};

export function InsightsList({ insights }: Props) {
  return (
    <Card className="bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-0.5">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
