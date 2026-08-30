"use client";

import Link from "next/link";
import { ArrowLeft, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/components/language-provider";

type Props = {
  username: string;
};

export function UserNotFoundCard({ username }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="border-2 border-border/80 text-center">
      <CardHeader className="pb-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="mt-4 text-2xl">{t("profile.notFound.title")}</CardTitle>
        <CardDescription className="mx-auto max-w-md text-base">
          {t("profile.notFound.description", { username })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/">
          <Button variant="primary" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>{t("profile.backHome")}</span>
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="secondary" className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            <span>{t("profile.backToLeaderboard")}</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
