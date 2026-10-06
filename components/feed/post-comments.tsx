"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/lib/actions/posts";
import type { PostComment } from "@/lib/data/posts";

interface PostCommentsProps {
  postId: string;
  count: number;
  comments: PostComment[];
}

export default function PostComments({ postId, count, comments }: PostCommentsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    startTransition(async () => {
      const result = await addComment(postId, trimmed);
      if (result.error) {
        setError(result.error);
      } else {
        setText("");
        setShowForm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setShowForm((prev) => !prev)}
        className="flex items-center gap-1.75 text-[#94887B] font-bold text-sm"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
        {count}
      </button>

      {comments.length > 0 && (
        <div className="flex flex-col gap-2 pl-2 border-l-2 border-[#F0E6D8]">
          {comments.map((comment) => (
            <div key={comment.id} className="text-[13px]">
              <span className="font-bold text-[#3F362E]">{comment.authorName}</span>{" "}
              <span className="text-[#4A4038]">{comment.body}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí un comentario..."
            className="w-full min-h-[60px] resize-y rounded-[10px] border-[1.5px] border-[#EADFD0] bg-white px-3 py-2 text-[14px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
          />
          {error && <div className="text-[12px] font-semibold text-[#D9583C]">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[13px] font-bold text-[#94887B] px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || text.trim().length === 0}
              className="rounded-[10px] bg-[#D9583C] px-3 py-1.5 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {isPending ? "Enviando..." : "Comentar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
