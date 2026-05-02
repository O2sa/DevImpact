import "./globals.css";
import type { ReactNode } from "react";
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

export const metadata = {
  title: "DevImpact",
  description: "GitHub user scoring",
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
