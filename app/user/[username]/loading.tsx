import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { UserProfileSkeleton } from "@/components/user-profile-skeleton";

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
