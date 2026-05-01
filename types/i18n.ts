export type Locale = string;

export type I18nContextValue = {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    dir: "ltr" | "rtl";
    locales: { value: Locale; label: string }[];
    ready: boolean;
};