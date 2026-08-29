import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { UserProfileClient } from "@/components/user-profile-client";
import { UserNotFoundCard } from "@/components/user-not-found";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { getUserProfile } from "@/lib/user";
import { toAbsoluteUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username.trim());

  let displayName = cleanUsername;
  try {
    const { user } = await getUserProfile(cleanUsername);
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

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username.trim());
  const profileUrl = toAbsoluteUrl(`/user/${cleanUsername}`);

  let profileData: Awaited<ReturnType<typeof getUserProfile>> | null = null;
  let fetchErrorMessage: string | null = null;

  try {
    profileData = await getUserProfile(cleanUsername);
  } catch (err: unknown) {
    fetchErrorMessage = err instanceof Error ? err.message : "Failed to load user profile";
  }

  if (!profileData || fetchErrorMessage) {
    return (
      <main className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16">
          <UserNotFoundCard username={cleanUsername} />
        </div>
        <AppFooter />
      </main>
    );
  }

  const { user, location } = profileData;
  const displayName = user.name?.trim() || user.username;

  const profilePageSchema = {
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
        name: displayName,
        item: profileUrl,
      },
    ],
  };

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <JsonLd data={profilePageSchema} />
        <JsonLd data={breadcrumbSchema} />

        <UserProfileClient user={user} location={location} />
      </div>
      <AppFooter />
    </main>
  );
}
