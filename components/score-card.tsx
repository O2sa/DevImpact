import { cn } from "../lib/utils";
import { useTranslation } from "./language-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type ScoreCardProps = {
  title: string;
  rawValue: number;
  normalizedValue?: number;
  highlight?: boolean;
  helperText?: string;
};

export function ScoreCard({
  title,
  rawValue,
  normalizedValue,
  highlight,
  helperText,
}: ScoreCardProps) {
  const { t } = useTranslation();
  const displayValue = normalizedValue ?? rawValue;
  const displayLabel = normalizedValue !== undefined ? `${Math.round(displayValue)} / 100` : Math.round(displayValue).toString();

  return (
    <div
      className={cn(
        "card flex flex-col gap-1 border bg-gradient-to-br from-card via-card to-muted/40 p-4 transition-all",
        highlight ? "border-primary/50 shadow-blue-200 dark:shadow-blue-950/40" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        {helperText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground"
                aria-label={helperText}
              >
                i
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{helperText}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <span className="text-2xl font-semibold text-foreground">{displayLabel}</span>
      {normalizedValue !== undefined ? (
        <span className="text-xs text-muted-foreground">
          {t("score.rawLabel", { value: rawValue.toFixed(2) })}
        </span>
      ) : null}
    </div>
  );
}
