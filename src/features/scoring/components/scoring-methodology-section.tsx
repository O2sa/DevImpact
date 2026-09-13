import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  description?: string;
  points: string[];
};

export function ScoringMethodologySection({ title, description, points }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        <ul className="space-y-2 text-sm text-muted-foreground">
          {points.map((point, index) => (
            <li key={`${title}-${index}`} className="rounded-md border border-border/70 p-2">
              {point}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
