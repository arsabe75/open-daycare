import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/current-user";
import { getFamilyFeedPosts } from "@/lib/actions/posts";
import FamilyView from "@/components/feed/family-view";

export default async function FamilyFeedPage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "parent") {
    redirect("/panel");
  }

  const posts = await getFamilyFeedPosts();

  return <FamilyView initialPosts={posts} user={user} />;
}
