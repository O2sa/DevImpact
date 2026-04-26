import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { useTranslation } from "./language-provider";

type CompareFormProps = {
  data?: boolean;
  onSubmit: (u1: string, u2: string) => void;
  loading?: boolean;
  reset?: () => void;
  swapUsers?: () => void;
  error?: string | null;
};

export function CompareForm({
  onSubmit,
  data,
  loading,
  swapUsers,
  reset,
  error,
}: CompareFormProps) {
  const { t } = useTranslation();
  const [username1, setUsername1] = useState("pbiggar");
  const [username2, setUsername2] = useState("CoralineAda");
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input on page load
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const canSubmit = Boolean(username1.trim() && username2.trim() && !loading);
  const isEmpty = (!username1.trim() && !username2.trim()) && !data;

  const handleSwap = () => {
    setUsername1(username2);
    setUsername2(username1);
    if (swapUsers) swapUsers();
  };

  const handleReset = () => {
    setUsername1("");
    setUsername2("");
    if (reset) reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(username1.trim(), username2.trim());
  };

  return (
    <form onSubmit={submit}>
      <Card className="border-0 shadow-lg p-6 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t("app.title")}</CardTitle>
          <CardDescription>{t("app.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent"
              ref={firstInputRef}
              placeholder={t("form.username1")}
              value={username1}
              onChange={(e) => setUsername1(e.target.value)}
            />
            <input
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent"
              placeholder={t("form.username2")}
              value={username2}
              onChange={(e) => setUsername2(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[140px] shadow-sm transition-transform hover:-translate-y-0.5"
            >
              {loading ? t("form.compare.ing") : t("form.compare")}
            </Button>
            <Button
              onClick={handleSwap}
              type="button"
              disabled={isEmpty || loading}
              title={t("form.swap")}
              className="shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleReset}
              title={t("form.reset")}
              disabled={isEmpty || loading}
              type="button"
              className="shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
