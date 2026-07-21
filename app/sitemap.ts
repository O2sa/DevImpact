import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import countriesData from "@/data/countries.json";

type CountryInfo = {
  slug: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const countries = countriesData as CountryInfo[];

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...countries.map((country) => ({
      url: `${baseUrl}/leaderboard/${country.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/scoring-methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  return entries;
}
