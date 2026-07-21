import type { Metadata } from "next";
import countriesData from "@/data/countries.json";
import { JsonLd } from "@/components/seo/json-ld";
import { getLeaderboardResult } from "@/lib/leaderboard";
import { toAbsoluteUrl } from "@/lib/seo";
import { CountryLeaderboardClient } from "./country-leaderboard-client";

type CountryInfo = {
  slug: string;
  title: string;
  keywords?: string[];
};

type Props = {
  params: Promise<{ country: string }>;
};

const countries = countriesData as CountryInfo[];

function formatCountryTitle(country: string): string {
  return country
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getCountryInfo(country: string): CountryInfo {
  return (
    countries.find((entry) => entry.slug === country) ?? {
      slug: country,
      title: formatCountryTitle(country),
      keywords: [],
    }
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryInfo = getCountryInfo(country);
  const pageTitle = `${countryInfo.title} Developer Leaderboard`;
  const description = `Explore the ${countryInfo.title} GitHub developer leaderboard on DevImpact. Compare repository impact, merged pull request strength, and community contribution signals in one country ranking.`;
  const keywords = [
    `${countryInfo.title} developer leaderboard`,
    `${countryInfo.title} GitHub developers`,
    `${countryInfo.title} open source ranking`,
    `${countryInfo.title} developer ranking`,
    "GitHub leaderboard",
    "developer impact score",
    ...(countryInfo.keywords ?? []).slice(0, 6),
  ];

  return {
    title: pageTitle,
    description,
    keywords,
    alternates: {
      canonical: `/leaderboard/${country}`,
    },
    openGraph: {
      type: "website",
      title: `${pageTitle} | DevImpact`,
      description,
      url: `/leaderboard/${country}`,
      images: [
        {
          url: toAbsoluteUrl("/og-image.svg"),
          width: 1200,
          height: 630,
          alt: `${countryInfo.title} developer leaderboard preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | DevImpact`,
      description,
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
}

export async function generateStaticParams() {
  return countries.map((country) => ({ country: country.slug }));
}

export default async function CountryLeaderboardPage({ params }: Props) {
  const { country } = await params;
  const countryInfo = getCountryInfo(country);
  const countryUrl = toAbsoluteUrl(`/leaderboard/${country}`);
  const leaderboard = await getLeaderboardResult(country);

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${countryInfo.title} Developer Leaderboard`,
    description: `Country ranking for ${countryInfo.title} developers based on repository impact, merged pull requests, and community contribution signals.`,
    url: countryUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "DevImpact",
      url: toAbsoluteUrl("/"),
    },
    about: {
      "@type": "Thing",
      name: `${countryInfo.title} open-source developers`,
    },
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
      {
        "@type": "ListItem",
        position: 3,
        name: countryInfo.title,
        item: countryUrl,
      },
    ],
  };

  const topUsersSchema = leaderboard.scored.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${countryInfo.title} top GitHub developers`,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: leaderboard.scored.length,
        itemListElement: leaderboard.scored.map((user) => ({
          "@type": "ListItem",
          position: user.impactRank,
          name: user.name || user.username,
          url: `https://github.com/${user.username}`,
        })),
      }
    : null;

  return (
    <>
      <JsonLd
        data={
          topUsersSchema
            ? [webPageSchema, breadcrumbSchema, topUsersSchema]
            : [webPageSchema, breadcrumbSchema]
        }
      />
      <CountryLeaderboardClient
        countryTitle={countryInfo.title}
        initialLeaderboard={leaderboard}
      />
    </>
  );
}
