"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReaction, removeReaction } from "@/lib/actions/posts";

interface PostReactionsProps {
  postId: string;
  count: number;
  hasLiked: boolean;
}

export default function PostReactions({ postId, count, hasLiked }: PostReactionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (hasLiked) {
        await removeReaction(postId);
      } else {
        await addReaction(postId);
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.75 text-[#E0654A] font-bold text-sm disabled:opacity-50"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill={hasLiked ? "#E0654A" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {count}
    </button>
  );
}
