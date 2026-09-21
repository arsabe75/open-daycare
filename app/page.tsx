import HomeView from "@/components/feed/home-view";
import { posts } from "@/lib/data/posts";

export default function Home() {
  return <HomeView initialPosts={posts} />;
}
