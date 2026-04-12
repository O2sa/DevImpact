import { cn } from "../lib/utils";

type ScoreCardProps = {
  title: string;
  value: number;
  highlight?: boolean;
  subtitle?: string;
};

export function ScoreCard({
  title,
  value,
  highlight,
  subtitle,
}: ScoreCardProps) {
  return (
    <div
      className={cn(
        "card p-4 flex flex-col gap-1 border bg-gradient-to-br from-white via-white to-slate-50 transition-all",
        highlight ? "border-blue-500/50 shadow-blue-200" : "border-slate-100"
      )}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900">
          {value.toFixed(2)}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 leading-tight">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
