import type { Metadata } from "next";
import { Suspense } from "react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { HomePageClient } from "@/components/home-page-client";
import { Skeleton } from "@/components/ui/skeleton";
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
    description: "Compare open-source impact using repository, PR, and contribution analytics.",
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

function HomePageFallback() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10">
        <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
          <div className="space-y-4 pb-4">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-md rounded-lg" />
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-11 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-11 rounded-lg" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded-full" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
          <Skeleton className="h-6 w-64 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>

      <AppFooter />
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={[websiteSchema, softwareSchema]} />
      <Suspense fallback={<HomePageFallback />}>
        <HomePageClient />
      </Suspense>
    </>
  );
}
