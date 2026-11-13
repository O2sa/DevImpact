import { UserProfileSkeleton } from "@/features/developer";

export default function UserProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <UserProfileSkeleton />
    </div>
  );
}
