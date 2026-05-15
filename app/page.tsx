import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/skeletons";
import { HomePageClient } from "@/components/home-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { toAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Compare GitHub Developers",
  description:
    "Compare GitHub developers side by side with transparent repository, pull request, and community contribution impact scoring.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Compare GitHub Developers | DevImpact",
    description:
      "Analyze repository quality, merged PR impact, and community contribution signals in one comparison dashboard.",
    url: "/",
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "DevImpact GitHub developer comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare GitHub Developers | DevImpact",
    description:
      "Compare open-source impact using repository, PR, and contribution analytics.",
    images: [toAbsoluteUrl("/og-image.svg")],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DevImpact",
  url: toAbsoluteUrl("/"),
  potentialAction: {
    "@type": "SearchAction",
    target: `${toAbsoluteUrl("/")}?username={username1}&username={username2}`,
    "query-input": "required name=username1",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DevImpact",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: toAbsoluteUrl("/"),
  description:
    "DevImpact compares GitHub developers using repository, pull request, and community contribution impact signals.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={[websiteSchema, softwareSchema]} />
      <Suspense fallback={<DashboardSkeleton />}>
        <HomePageClient />
      </Suspense>
    </>
  );
}
