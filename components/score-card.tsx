import { cn } from "../lib/utils";

type ScoreCardProps = {
  title: string;
  value: number;
  highlight?: boolean;
  subtitle?: string;
};

export function ScoreCard({ title, value, highlight, subtitle }: ScoreCardProps) {
  return (
    <div
      className={cn(
        "card p-4 flex flex-col gap-1 border bg-gradient-to-br from-card via-card to-muted/40 transition-all",
        highlight ? "border-primary/50 shadow-blue-200 dark:shadow-blue-950/40" : "border-border"
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">
          {value.toFixed(2)}
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground leading-tight">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
