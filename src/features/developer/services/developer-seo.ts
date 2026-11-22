import { toAbsoluteUrl } from "@/lib/seo";
import { detectCountry } from "@/lib/geo";
import countriesData from "@/data/countries.json";
import type { UserResult } from "../types";

type CountryInfo = {
  slug: string;
  title: string;
};

const countries = countriesData as CountryInfo[];

export function buildUserProfileSchema(user: UserResult, location?: string | null) {
  const displayName = user.name?.trim() || user.username;
  const profileUrl = toAbsoluteUrl(`/user/${user.username}`);

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${displayName} Developer Profile`,
    description: `Open-source impact statistics and scoring for ${displayName} (@${user.username}).`,
    url: profileUrl,
    mainEntity: {
      "@type": "Person",
      name: displayName,
      alternateName: user.username,
      image: user.avatarUrl,
      url: `https://github.com/${user.username}`,
      ...(location ? { homeLocation: location } : {}),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: user.finalScore,
        },
      ],
    },
    isPartOf: {
      "@type": "WebSite",
      name: "DevImpact",
      url: toAbsoluteUrl("/"),
    },
  };
}

export function buildUserBreadcrumbSchema(
  user: UserResult,
  location?: string | null,
  countryParam?: string,
) {
  const displayName = user.name?.trim() || user.username;
  const profileUrl = toAbsoluteUrl(`/user/${user.username}`);
  const detectedSlug = (countryParam || detectCountry(location ?? null))?.trim().toLowerCase();
  const countryInfo = detectedSlug
    ? countries.find((c) => c.slug.toLowerCase() === detectedSlug)
    : null;

  const breadcrumbElements = [
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
  ];

  if (countryInfo) {
    breadcrumbElements.push({
      "@type": "ListItem",
      position: 3,
      name: countryInfo.title,
      item: toAbsoluteUrl(`/leaderboard/${countryInfo.slug}`),
    });
    breadcrumbElements.push({
      "@type": "ListItem",
      position: 4,
      name: displayName,
      item: profileUrl,
    });
  } else {
    breadcrumbElements.push({
      "@type": "ListItem",
      position: 3,
      name: displayName,
      item: profileUrl,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbElements,
  };
}
