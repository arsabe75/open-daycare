import HomeView from "@/components/feed/home-view";
import { posts } from "@/lib/data/posts";
import { getCurrentUserProfile } from "@/lib/current-user";

export default async function Home() {
  const user = await getCurrentUserProfile();
  return <HomeView initialPosts={posts} user={user} />;
}
