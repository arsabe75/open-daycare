"use client";

import { useState } from "react";
import type { Post } from "@/lib/data/posts";
import type { CurrentUserProfile } from "@/lib/current-user";
import Composer from "@/components/feed/composer";
import HomePostCard from "@/components/feed/post-card";
import NewPostDialog from "@/components/feed/new-post-dialog";
import Sidebar from "@/components/sidebar";

interface HomeViewProps {
  initialPosts: Post[];
  user?: CurrentUserProfile | null;
}

export default function HomeView({ initialPosts, user }: HomeViewProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handlePublish(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "Invitado";

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar
        activeHref="/"
        onNewPost={() => setDialogOpen(true)}
        user={user}
      />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-190 w-full mx-auto px-10 pt-8.5 pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display font-semibold text-[30px] text-[#3F362E] m-0">
              Buenas, {firstName}
            </h1>
            <p className="mt-1.25 text-[#94887B] text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <Composer onClick={() => setDialogOpen(true)} />

          <div className="flex items-center gap-3.5 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <HomePostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>

      <NewPostDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onPublish={handlePublish}
      />
    </div>
  );
}
