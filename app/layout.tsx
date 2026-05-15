import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocaleDir,
  isSupportedLocale,
  parseAcceptLanguage,
  supportedLocales,
} from "@/lib/i18n-core";
import { getMetadataBase, toAbsoluteUrl } from "@/lib/seo";
import Providers from "./providers";

const themeInitScript = `
  try {
    const storageKey = "devimpact-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {}
`;

export const metadata: Metadata = {
  title: {
    default: "DevImpact | GitHub Developer Comparison & Open-Source Impact Scoring",
    template: "%s | DevImpact",
  },
  description:
    "Compare GitHub developers by repository impact, merged external pull requests, and community contribution signals with transparent scoring.",
  keywords: [
    "github developer comparison",
    "open source impact score",
    "github repository analytics",
    "pull request impact",
    "developer ranking tool",
    "devimpact",
  ],
  authors: [{ name: "DevImpact Team" }],
  creator: "DevImpact",
  publisher: "DevImpact",
  metadataBase: getMetadataBase(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "DevImpact | GitHub Developer Comparison & Open-Source Impact Scoring",
    description:
      "Compare GitHub developers with transparent repo, PR, and community contribution scoring.",
    url: "/",
    siteName: "DevImpact",
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "DevImpact GitHub developer comparison dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevImpact | GitHub Developer Comparison",
    description:
      "Compare open-source impact using repository, pull request, and community contribution signals.",
    images: [toAbsoluteUrl("/og-image.svg")],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : parseAcceptLanguage(
        headerStore.get("accept-language"),
        supportedLocales,
        DEFAULT_LOCALE
      );
  const dir = getLocaleDir(initialLocale);

  return (
    <html lang={initialLocale} dir={dir} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
