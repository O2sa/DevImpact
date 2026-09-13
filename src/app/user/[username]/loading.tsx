import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { UserProfileSkeleton } from "@/features/developer";

export default function UserProfileLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <UserProfileSkeleton />
      </div>
      <AppFooter />
    </main>
  );
}
