import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { toAbsoluteUrl } from "@/lib/seo";
import countriesData from "@/data/countries.json";
import { CountryGridClient } from "./country-grid-client";
import type { CountryInfo } from "@/types/leaderboard";

// ─── Metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Leaderboard — Country Impact Rankings",
  description:
    "Browse committers.top countries and view developers ranked by DevImpact's transparent repository, PR, and community contribution scoring.",
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    title: "Country Leaderboards by Impact | DevImpact",
    description:
      "Browse committers.top country leaderboards reordered by real open-source impact: repository quality, merged PRs, and community contributions.",
    url: "/leaderboard",
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "DevImpact Country Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Country Leaderboards by Impact | DevImpact",
    description:
      "Browse committers.top country leaderboards reordered by real open-source impact.",
    images: [toAbsoluteUrl("/og-image.svg")],
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Country Leaderboards by Impact",
  description:
    "Browse committers.top country leaderboards reordered by DevImpact impact scoring.",
  url: toAbsoluteUrl("/leaderboard"),
};

// ─── Static country list (sourced from committers.top YAML, converted to JSON) ─
const countries: CountryInfo[] = countriesData as CountryInfo[];

// ─── Page ──────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  return (
    <>
      <JsonLd data={[webPageSchema]} />
      <main className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-10 space-y-6">
          <CountryGridClient countries={countries} />
        </div>
        <AppFooter />
      </main>
    </>
  );
}
