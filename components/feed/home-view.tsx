"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Child } from "@/lib/child-types";
import type { Post } from "@/lib/data/posts";
import type { CurrentUserProfile } from "@/lib/current-user";
import Composer from "@/components/feed/composer";
import HomePostCard from "@/components/feed/post-card";
import NewPostDialog from "@/components/feed/new-post-dialog";
import Sidebar from "@/components/sidebar";

interface Room {
  id: string;
  name: string;
}

interface HomeViewProps {
  initialPosts: Post[];
  kids: Child[];
  rooms: Room[];
  user?: CurrentUserProfile | null;
}

export default function HomeView({ initialPosts, kids, rooms, user }: HomeViewProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isStaff = user?.role === "staff" || user?.role === "admin";
  const posts = initialPosts;

  function handleDialogClose() {
    setDialogOpen(false);
    router.refresh();
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "Invitado";

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar
        activeHref="/"
        onNewPost={isStaff ? () => setDialogOpen(true) : undefined}
        user={user}
      />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-190 w-full mx-auto px-10 pt-8.5 pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
              GUARDERÍA · {user?.daycareName?.toUpperCase() ?? "SALA SOLES"}
            </div>
            <h1 className="font-display font-semibold text-[30px] text-[#3F362E] m-0">
              Buenas, {firstName}
            </h1>
            <p className="mt-1.25 text-[#94887B] text-[14.5px]">
              {kids.length} niños · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
            </p>
          </div>

          {isStaff && <Composer onClick={() => setDialogOpen(true)} />}

          <div className="flex items-center gap-3.5 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.length === 0 && (
              <div className="text-center py-12 text-[#94887B]">
                Todavía no hay publicaciones.
              </div>
            )}
            {posts.map((post) => (
              <HomePostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>

      {isStaff && (
        <NewPostDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          kids={kids}
          rooms={rooms}
        />
      )}
    </div>
  );
}
