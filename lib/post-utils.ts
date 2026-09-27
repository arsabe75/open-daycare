import type { Child } from "@/lib/child-types";
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
  children: Child[] | "classroom";
  text: string;
}): Post {
  const { type, children: selectedChildren, text } = input;
  const isClassroom = selectedChildren === "classroom";

  if (isClassroom) {
    return {
      id: generateId(),
      type,
      childName: undefined,
      audience: "toda la sala",
      time: currentTime(),
      authorNote: "publicado por vos",
      text: text.trim(),
      likes: 0,
      comments: 0,
    };
  }

  const names = selectedChildren.map((child) => firstName(child.name));
  const childName = names.join(", ");
  const audience =
    names.length === 1
      ? `familia de ${names[0]}`
      : `familias de ${names.join(", ")}`;

  return {
    id: generateId(),
    type,
    childName,
    audience,
    time: currentTime(),
    authorNote: "publicado por vos",
    text: text.trim(),
    likes: 0,
    comments: 0,
  };
}
