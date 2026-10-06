import Image from "next/image";
import type { Post } from "@/lib/data/posts";
import { POST_TYPE_META } from "@/lib/post-types";
import PostReactions from "@/components/feed/post-reactions";
import PostComments from "@/components/feed/post-comments";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const meta = POST_TYPE_META[post.type];
  const showMegaphone = !post.childName;
  const initial = post.childName ? post.childName.charAt(0).toUpperCase() : null;
  const title = post.childName ?? (post.type === "announcement" ? "Anuncio general" : "Toda la sala");
  const hasPhotos = post.photos.length > 0;

  return (
    <article className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-[20px] p-5 px-5.5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="flex items-center gap-3 mb-3.5">
        {showMegaphone ? (
          <div className="w-11 h-11 rounded-full bg-[#CCD8F4] text-[#4E72C8] flex items-center justify-center flex-none">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#A9D9E8] text-[#1F7A93] font-display font-semibold text-[17px] flex items-center justify-center flex-none">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display font-semibold text-[16.5px] text-[#3F362E]">
            {title}
          </div>
          <div className="text-[12.5px] text-[#A89A8B]">
            {post.time} · {post.authorNote}
          </div>
        </div>
        <div
          className="flex items-center gap-1.75 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: meta.pastel }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: meta.accent }}
          />
          <span
            className="text-xs font-extrabold tracking-[0.5px]"
            style={{ color: meta.accent }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      <div className="text-[12.5px] text-[#A89A8B] mb-2.5">
        Para: {post.audience}
      </div>

      <p className="text-[15.5px] leading-[1.55] text-[#4A4038] m-0">
        {post.text}
      </p>

      {hasPhotos && (
        <div className={`grid gap-2 mt-3.5 ${post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative overflow-hidden rounded-2xl border border-[#ECE0D0] bg-[#F4ECE1] ${post.photos.length === 1 ? "h-64" : "h-40"}`}
            >
              {photo.signedUrl ? (
                <Image
                  src={photo.signedUrl}
                  alt="Foto de la publicación"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#B0A290]">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-4.5 mt-4 pt-3.5 border-t border-[#F0E6D8]">
        <PostReactions postId={post.id} count={post.likes} hasLiked={!!post.userHasLiked} />
        <PostComments postId={post.id} count={post.comments} comments={post.commentsList} />
      </div>
    </article>
  );
}
