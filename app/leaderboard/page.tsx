import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { toAbsoluteUrl } from "@/lib/seo";
import countriesData from "@/data/countries.json";
import { CountryGridClient } from "./country-grid-client";
import { LeaderboardHero } from "./leaderboard-hero";
import type { CountryInfo } from "@/types/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard - Country Impact Rankings",
  description:
    "Browse country leaderboards and view developers ranked by DevImpact's transparent repository, PR, and community contribution scoring.",
  keywords: [
    "github leaderboard",
    "country developer leaderboard",
    "open source developer rankings",
    "github developer rankings by country",
    "developer impact leaderboard",
    "devimpact leaderboard",
  ],
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    type: "website",
    title: "Country Leaderboards by Impact | DevImpact",
    description:
      "Browse country leaderboards ranked by real open-source impact: repository quality, merged PRs, and community contributions.",
    url: "/leaderboard",
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "DevImpact country leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Country Leaderboards by Impact | DevImpact",
    description:
      "Browse country leaderboards ranked by real open-source impact.",
    images: [toAbsoluteUrl("/og-image.svg")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const countries: CountryInfo[] = countriesData as CountryInfo[];

const collectionPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Country Leaderboards by Impact",
  description:
    "Browse country leaderboards ranked by DevImpact impact scoring.",
  url: toAbsoluteUrl("/leaderboard"),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: toAbsoluteUrl("/"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Leaderboards",
      item: toAbsoluteUrl("/leaderboard"),
    },
  ],
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Developer leaderboards by country",
  itemListOrder: "https://schema.org/ItemListUnordered",
  numberOfItems: countries.length,
  itemListElement: countries.slice(0, 24).map((country, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: `${country.title} Developer Leaderboard`,
    url: toAbsoluteUrl(`/leaderboard/${country.slug}`),
  })),
};

export default function LeaderboardPage() {
  return (
    <>
      <JsonLd data={[collectionPageSchema, breadcrumbSchema, itemListSchema]} />
      <main className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
          <LeaderboardHero countryCount={countries.length} />

          <CountryGridClient countries={countries} />
        </div>
        <AppFooter />
      </main>
    </>
  );
}
