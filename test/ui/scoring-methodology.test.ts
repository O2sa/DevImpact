import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import { SCORING_FLOW_STEP_KEYS } from "@/components/scoring/scoring-methodology-flow";

const REQUIRED_METHODLOGY_KEYS = [
  "methodology.back",
  "methodology.title",
  "methodology.intro",
  "methodology.cta.description",
  "methodology.cta.button",
  "methodology.flow.title",
  "methodology.flow.stepLabel",
  "methodology.sections.components.title",
  "methodology.sections.weights.title",
  "methodology.sections.diminishing.title",
  "methodology.sections.adjustments.title",
  "methodology.sections.normalization.title",
  "methodology.sections.signals.title",
] as const;

function expectLocaleKeys(locale: Record<string, string>) {
  for (const key of REQUIRED_METHODLOGY_KEYS) {
    expect(locale[key]).toBeTypeOf("string");
    expect(locale[key]?.trim().length).toBeGreaterThan(0);
  }

  for (const key of SCORING_FLOW_STEP_KEYS) {
    expect(locale[key]).toBeTypeOf("string");
    expect(locale[key]?.trim().length).toBeGreaterThan(0);
  }
}

describe("scoring methodology localization", () => {
  test("flow map has expected steps", () => {
    expect(SCORING_FLOW_STEP_KEYS).toHaveLength(7);
    expect(SCORING_FLOW_STEP_KEYS[0]).toBe("methodology.flow.step.collect");
    expect(SCORING_FLOW_STEP_KEYS[6]).toBe("methodology.flow.step.normalize");
  });

  test("english localization includes methodology keys", () => {
    expectLocaleKeys(en as Record<string, string>);
  });

  test("arabic localization includes methodology keys", () => {
    expectLocaleKeys(ar as Record<string, string>);
  });

  test("result dashboard links to methodology page", () => {
    const dashboardPath = resolve(
      process.cwd(),
      "components",
      "result-dashboard.tsx",
    );
    const source = readFileSync(dashboardPath, "utf8");
    expect(source.includes("/scoring-methodology")).toBe(true);
  });

  test("methodology route file exists", () => {
    const routePath = resolve(
      process.cwd(),
      "app",
      "scoring-methodology",
      "page.tsx",
    );
    const source = readFileSync(routePath, "utf8");
    expect(source.includes("ScoringMethodologyPage")).toBe(true);
  });
});
