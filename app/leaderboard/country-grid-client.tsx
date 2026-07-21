"use client";

import { useState, useMemo } from "react";
import { Globe, Search, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";
import { getCountryCode } from "@/lib/country-flags";
import type { CountryInfo } from "@/types/leaderboard";
import type { Route } from "next";

type Props = {
  countries: CountryInfo[];
};

export function CountryGridClient({ countries }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.trim().toLowerCase();
    return countries.filter(
      (c) =>
        c.slug.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
    );
  }, [countries, search]);

  return (
    <Card className="border-0 p-6 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          {t("leaderboard.header.eyebrow")}
        </p>
        <CardTitle>{t("leaderboard.header.title")}</CardTitle>
        <CardDescription>
          {t("leaderboard.header.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {countries.length > 10 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              placeholder={t("leaderboard.searchCountry")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground animate-fadeIn">
            <Image
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              className="opacity-30"
            />
            <p className="text-lg font-medium">
              {search
                ? t("leaderboard.noCountriesSearch")
                : t("leaderboard.empty.title")}
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((c) => {
              const code = getCountryCode(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/leaderboard/${c.slug}` as Route}
                  className="group flex flex-col items-start gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-primary">
                    {code ? (
                      <span
                        className={`fi fi-${code} fis inline-block h-4 w-4 rounded-sm`}
                        title={c.title}
                      />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    )}
                    {c.title}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {t("leaderboard.viewCountry")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
