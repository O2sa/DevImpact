import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { ScoringMethodologyPageClient } from "@/components/scoring-methodology-page-client";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Scoring Methodology",
  description:
    "Understand the DevImpact scoring algorithm in detail, including repo score, PR score, contribution score, normalization, and weighting.",
  alternates: {
    canonical: "/scoring-methodology",
  },
  openGraph: {
    title: "DevImpact Scoring Methodology",
    description:
      "Learn how DevImpact calculates GitHub developer comparison scores with transparent formulas and weighting.",
    url: "/scoring-methodology",
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "DevImpact scoring methodology overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevImpact Scoring Methodology",
    description:
      "Detailed breakdown of repository, pull request, contribution, and final score calculations.",
    images: [toAbsoluteUrl("/og-image.svg")],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does DevImpact calculate final score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DevImpact uses a weighted formula: finalScore = repoScore * 0.45 + prScore * 0.45 + contributionScore * 0.10.",
      },
    },
    {
      "@type": "Question",
      name: "What signals are included in repository score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Repository score uses stars, forks, watchers, recency/activity factors, and ranking weights with diminishing impact after top repositories.",
      },
    },
    {
      "@type": "Question",
      name: "How does DevImpact prevent score gaming?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The algorithm applies fork penalties, PR size penalties, diminishing returns for repeated contributions, and caps contribution score so it cannot dominate the final result.",
      },
    },
  ],
};

export default function ScoringMethodologyPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <ScoringMethodologyPageClient />
    </>
  );
}
