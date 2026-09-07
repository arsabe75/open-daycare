import type { Avatar } from "@/lib/data/children";

interface ChildAvatarProps {
  avatar: Avatar;
  size: "card" | "profile";
  className?: string;
}

export default function ChildAvatar({ avatar, size, className = "" }: ChildAvatarProps) {
  const sizeClasses =
    size === "profile"
      ? "w-21 h-21 text-[34px]"
      : "w-12 h-12 text-[19px]";

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-none font-display font-semibold ${sizeClasses} ${className}`}
      style={{ backgroundColor: avatar.bg, color: avatar.color }}
    >
      {avatar.initial}
    </div>
  );
}
