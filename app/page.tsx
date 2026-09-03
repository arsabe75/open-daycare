import Sidebar from "@/components/sidebar";
import Composer from "@/components/feed/composer";
import PostCard from "@/components/feed/post-card";
import { posts } from "@/lib/data/posts";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display font-semibold text-[30px] text-[#3F362E] m-0">
              Buenas, Caro
            </h1>
            <p className="mt-[5px] text-[#94887B] text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <Composer />

          <div className="flex items-center gap-[14px] mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
