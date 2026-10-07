"use client";

import type { Post } from "@/lib/data/posts";
import type { CurrentUserProfile } from "@/lib/current-user";
import HomePostCard from "@/components/feed/post-card";
import FamilySidebar from "@/components/family-sidebar";

interface FamilyViewProps {
  initialPosts: Post[];
  user?: CurrentUserProfile | null;
}

export default function FamilyView({ initialPosts, user }: FamilyViewProps) {
  const posts = initialPosts;
  const firstName = user?.fullName?.split(" ")[0] ?? "Invitado";

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <FamilySidebar activeHref="/familia" user={user} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-190 w-full mx-auto px-10 pt-8.5 pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
              FAMILIA
            </div>
            <h1 className="font-display font-semibold text-[30px] text-[#3F362E] m-0">
              TU FAMILIA
            </h1>
            <p className="mt-1.25 text-[#94887B] text-[14.5px]">
              Hola, {firstName} · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
            </p>
          </div>

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
    </div>
  );
}
