"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useTranslation } from "@/components/providers/language-provider";
import { handleEscapeToClear, useHotkeys } from "@/hooks";
import { cn } from "@/utils/cn";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchField({ value, onChange, placeholder, className }: SearchFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkeys({ "/": () => inputRef.current?.focus() });

  return (
    <div className={cn("relative max-w-sm", className)}>
      <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        className="peer h-9 pe-10 ps-9"
        placeholder={placeholder}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
          handleEscapeToClear(e, value, onChange)
        }
        aria-label={placeholder}
        aria-keyshortcuts="/"
      />
      <Kbd
        aria-hidden="true"
        title={t("shortcut.focusInput")}
        className="absolute end-3 top-1/2 hidden -translate-y-1/2 peer-focus:hidden sm:inline-flex"
      >
        /
      </Kbd>
    </div>
  );
}
