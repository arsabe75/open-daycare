import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/current-user";
import { getActiveChildrenWithRoom } from "@/lib/data/children";
import { getRooms } from "@/lib/data/rooms";
import { getFeedPosts } from "@/lib/actions/posts";
import HomeView from "@/components/feed/home-view";

export default async function HomePage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  const [posts, children, rooms] = await Promise.all([
    getFeedPosts(),
    getActiveChildrenWithRoom(),
    getRooms(),
  ]);

  return <HomeView initialPosts={posts} kids={children} rooms={rooms} user={user} />;
}
