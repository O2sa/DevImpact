import { useState } from "react";
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
  data?: any;
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

  const canSubmit = Boolean(username1.trim() && username2.trim() && !loading);

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
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent bg-white"
              placeholder={t("form.username1") }
              value={username1}
              onChange={(e) => setUsername1(e.target.value)}
            />
            <input
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent bg-white"
              placeholder={t("form.username2") }
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
            {data && (
              <>
                <Button
                  onClick={handleSwap}
                  disabled={loading}
                  type="button"
                  title={t("form.swap")}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={loading}
                  title={t("form.reset")}
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
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
