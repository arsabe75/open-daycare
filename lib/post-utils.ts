import type { Child } from "@/lib/data/children";
import type { Post, PostType } from "@/lib/data/posts";

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildPost(input: {
  type: PostType;
  child: Child | "classroom";
  text: string;
}): Post {
  const { type, child, text } = input;
  const isClassroom = child === "classroom";

  return {
    id: generateId(),
    type,
    childName: isClassroom ? undefined : firstName(child.name),
    audience: isClassroom
      ? "toda la sala"
      : `familia de ${firstName(child.name)}`,
    time: currentTime(),
    authorNote: "publicado por vos",
    text: text.trim(),
    likes: 0,
    comments: 0,
  };
}
