import type { Child } from "@/lib/child-types";
import type { Post, PostType } from "@/lib/data/posts";

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function buildPost(input: {
  type: PostType;
  children: Child[] | "classroom";
  text: string;
  publishedAt?: Date;
}): Post {
  const { type, children: selectedChildren, text, publishedAt } = input;
  const isClassroom = selectedChildren === "classroom";
  const now = publishedAt ?? new Date();

  if (isClassroom) {
    return {
      id: "",
      type,
      childName: undefined,
      audience: "toda la sala",
      time: formatTime(now),
      authorNote: "publicado por vos",
      text: text.trim(),
      photos: [],
      likes: 0,
      comments: 0,
      commentsList: [],
      publishedAt: now.toISOString(),
    };
  }

  const names = selectedChildren.map((child) => firstName(child.name));
  const childName = names.join(", ");
  const audience =
    names.length === 1
      ? `familia de ${names[0]}`
      : `familias de ${names.join(", ")}`;

  return {
    id: "",
    type,
    childName,
    audience,
    time: formatTime(now),
    authorNote: "publicado por vos",
    text: text.trim(),
    photos: [],
    likes: 0,
    comments: 0,
    commentsList: [],
    publishedAt: now.toISOString(),
  };
}
