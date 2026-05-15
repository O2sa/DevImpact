import { useEffect, useRef } from "react";
import { ArrowLeftRight, RefreshCw, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { useTranslation } from "./language-provider";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "C++",
] as const;

const MAX_SELECTED_LANGUAGES = 5;

type CompareFormProps = {
  username1: string;
  username2: string;
  selectedLanguages: string[];
  setUsername1: (value: string) => void;
  setUsername2: (value: string) => void;
  setSelectedLanguages: (value: string[]) => void;
  hasData?: boolean;
  onSubmit: (
    username1: string,
    username2: string,
    options: { selectedLanguages: string[] },
  ) => void;
  loading?: boolean;
  reset?: () => void;
  swapUsers?: () => void;
  error?: string | null;
};

export function CompareForm({
  username1,
  username2,
  selectedLanguages,
  setUsername1,
  setUsername2,
  setSelectedLanguages,
  hasData,
  onSubmit,
  loading,
  swapUsers,
  reset,
  error,
}: CompareFormProps) {
  const { t } = useTranslation();
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const canSubmit = Boolean(username1.trim() && username2.trim() && !loading);
  const isEmpty = !username1.trim() && !username2.trim() && !hasData;
  const hasLanguageSelection = selectedLanguages.length > 0;

  const toggleLanguage = (language: string) => {
    const exists = selectedLanguages.some(
      (selected) => selected.toLowerCase() === language.toLowerCase(),
    );

    if (exists) {
      setSelectedLanguages(
        selectedLanguages.filter(
          (selected) => selected.toLowerCase() !== language.toLowerCase(),
        ),
      );
      return;
    }

    if (selectedLanguages.length >= MAX_SELECTED_LANGUAGES) {
      return;
    }

    setSelectedLanguages([...selectedLanguages, language]);
  };

  const clearLanguages = () => {
    setSelectedLanguages([]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(username1.trim(), username2.trim(), {
      selectedLanguages,
    });
  };

  return (
    <form onSubmit={submit}>
      <Card className="border-0 p-6 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            {t("form.header.eyebrow")}
          </p>
          <CardTitle>{t("app.title")}</CardTitle>
          <CardDescription>{t("form.enterTwo")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="username1" className="text-xs font-semibold text-muted-foreground">
                {t("form.username1.label")}
              </label>
              <Input
                id="username1"
                className="h-11"
                ref={firstInputRef}
                placeholder={t("form.username1")}
                value={username1}
                onChange={(e) => setUsername1(e.target.value)}
                aria-label={t("form.username1.label")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="username2" className="text-xs font-semibold text-muted-foreground">
                {t("form.username2.label")}
              </label>
              <Input
                id="username2"
                className="h-11"
                placeholder={t("form.username2")}
                value={username2}
                onChange={(e) => setUsername2(e.target.value)}
                aria-label={t("form.username2.label")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("form.languages.title")}</p>
                <p className="text-xs text-muted-foreground">{t("form.languages.description")}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearLanguages}
                disabled={!hasLanguageSelection || Boolean(loading)}
                aria-label={t("form.languages.clear")}
              >
                {t("form.languages.clear")}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((language) => {
                const isSelected = selectedLanguages.some(
                  (selected) => selected.toLowerCase() === language.toLowerCase(),
                );
                const maxReached =
                  selectedLanguages.length >= MAX_SELECTED_LANGUAGES && !isSelected;

                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() => toggleLanguage(language)}
                    disabled={maxReached || Boolean(loading)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      isSelected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                      maxReached && "cursor-not-allowed opacity-60",
                    )}
                    aria-pressed={isSelected}
                    aria-label={t("form.languages.toggle", { language })}
                  >
                    {language}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasLanguageSelection ? (
                selectedLanguages.map((language) => (
                  <span
                    key={language}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLanguages(
                          selectedLanguages.filter((item) => item !== language),
                        )
                      }
                      aria-label={t("form.languages.remove", { language })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">{t("form.languages.empty")}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[160px] shadow-sm transition-transform hover:-translate-y-0.5"
            >
              {loading ? t("form.compare.ing") : t("form.compare")}
            </Button>
            <Button
              onClick={swapUsers}
              type="button"
              variant="secondary"
              disabled={isEmpty || Boolean(loading)}
              title={t("form.swap")}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={reset}
              title={t("form.reset")}
              disabled={isEmpty || Boolean(loading)}
              type="button"
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
}
