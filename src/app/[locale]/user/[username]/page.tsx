import { cache } from "react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { UserProfileClient, UserNotFoundCard } from "@/features/developer";
import {
  getUserProfile,
  buildUserProfileSchema,
  buildUserBreadcrumbSchema,
} from "@/features/developer/services";
import { toAbsoluteUrl } from "@/lib/seo";

const getCachedUserProfile = cache(async (username: string) => {
  return getUserProfile(username);
});

export const revalidate = 1800; // Cache user profile on Edge CDN for 30 minutes via ISR
export const dynamicParams = true;

type Props = {
  params: Promise<{ locale?: string; username: string }>;
  searchParams?: Promise<{ country?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username.trim());

  let displayName = cleanUsername;
  try {
    const { user } = await getCachedUserProfile(cleanUsername);
    displayName = user.name?.trim() || cleanUsername;
  } catch {
    // Fallback if user cannot be fetched during metadata generation
  }

  const pageTitle = `${displayName} (@${cleanUsername}) - Developer Impact & Stats`;
  const description = `Explore ${displayName}'s (@${cleanUsername}) open-source developer impact score, top repositories, merged pull requests, and community contributions on DevImpact.`;
  const pageUrl = `/user/${cleanUsername}`;

  return {
    title: pageTitle,
    description,
    keywords: [
      `${cleanUsername} GitHub`,
      `${displayName} developer stats`,
      `${cleanUsername} open source impact`,
      "developer impact score",
      "GitHub profile analytics",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "profile",
      title: `${pageTitle} | DevImpact`,
      description,
      url: pageUrl,
      images: [
        {
          url: toAbsoluteUrl("/og-image.svg"),
          width: 1200,
          height: 630,
          alt: `${displayName} GitHub developer impact score preview`,
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

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username.trim());
  const profileUrl = toAbsoluteUrl(`/user/${cleanUsername}`);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const countryParam = resolvedSearchParams?.country;

  let profileData: Awaited<ReturnType<typeof getUserProfile>> | null = null;
  let fetchErrorMessage: string | null = null;

  try {
    profileData = await getCachedUserProfile(cleanUsername);
  } catch (err: unknown) {
    fetchErrorMessage = err instanceof Error ? err.message : "Failed to load user profile";
  }

  if (!profileData || fetchErrorMessage) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
        <UserNotFoundCard username={cleanUsername} />
      </div>
    );
  }

  const { user, location } = profileData;
  const profilePageSchema = buildUserProfileSchema(user, location);
  const breadcrumbSchema = buildUserBreadcrumbSchema(user, location, countryParam);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <JsonLd data={profilePageSchema} />
      <JsonLd data={breadcrumbSchema} />

      <UserProfileClient user={user} location={location} countryParam={countryParam} />
    </div>
  );
}
