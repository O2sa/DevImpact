export type PageProps<
  TParams = Record<string, string>,
  TSearchParams = Record<string, string | string[] | undefined>,
> = {
  params: Promise<TParams>;
  searchParams?: Promise<TSearchParams>;
};

export type LayoutProps<TParams = Record<string, string>> = {
  children: React.ReactNode;
  params?: Promise<TParams>;
};
