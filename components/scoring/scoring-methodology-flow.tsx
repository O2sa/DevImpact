"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";

export const SCORING_FLOW_STEP_KEYS = [
  "methodology.flow.step.collect",
  "methodology.flow.step.repo",
  "methodology.flow.step.pr",
  "methodology.flow.step.community",
  "methodology.flow.step.adjustments",
  "methodology.flow.step.final",
  "methodology.flow.step.normalize",
] as const;

type FlowNodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const FLOW_VIEWPORT = {
  width: 1000,
  height: 920,
} as const;

const NODE_WIDTH = 860;
const NODE_HEIGHT = 95;
const NODE_X = (FLOW_VIEWPORT.width - NODE_WIDTH) / 2;
const NODE_GAP = 32;

const FLOW_NODE_LAYOUTS: FlowNodeLayout[] = SCORING_FLOW_STEP_KEYS.map(
  (_step, index) => ({
    x: NODE_X,
    y: 24 + index * (NODE_HEIGHT + NODE_GAP),
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  }),
);

function toPercent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export function ScoringMethodologyFlow() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("methodology.flow.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background/40">
          <div
            className="relative w-full"
            style={{ paddingBottom: toPercent(FLOW_VIEWPORT.height, FLOW_VIEWPORT.width) }}
          >
            <svg
              viewBox={`0 0 ${FLOW_VIEWPORT.width} ${FLOW_VIEWPORT.height}`}
              role="img"
              aria-label={t("methodology.flow.title")}
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <marker
                  id="flow-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--muted-foreground))" />
                </marker>
              </defs>

              {FLOW_NODE_LAYOUTS.slice(0, -1).map((node, index) => {
                const next = FLOW_NODE_LAYOUTS[index + 1];
                const fromX = node.x + node.width / 2;
                const fromY = node.y + node.height + 2;
                const toX = next.x + next.width / 2;
                const toY = next.y - 10;

                return (
                  <line
                    key={`connector-${index}`}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity={0.7}
                    strokeWidth={2}
                    markerEnd="url(#flow-arrow)"
                  />
                );
              })}
            </svg>

            {FLOW_NODE_LAYOUTS.map((node, index) => {
              const key = SCORING_FLOW_STEP_KEYS[index];
              return (
                <div
                  key={key}
                  className="absolute rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm"
                  style={{
                    left: toPercent(node.x, FLOW_VIEWPORT.width),
                    top: toPercent(node.y, FLOW_VIEWPORT.height),
                    width: toPercent(node.width, FLOW_VIEWPORT.width),
                    height: toPercent(node.height, FLOW_VIEWPORT.height),
                  }}
                >
                  <p
                    className="text-center text-xs font-semibold text-primary"
                  >
                    {t("methodology.flow.stepLabel", { number: index + 1 })}
                  </p>
                  <p
                    className="mt-1 line-clamp-2 text-center text-sm font-medium leading-snug text-foreground"
                  >
                    {t(key)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="sr-only">
          {SCORING_FLOW_STEP_KEYS.map((key, index) => `${index + 1}. ${t(key)}`).join(" ")}
        </p>
      </CardContent>
    </Card>
  );
}
