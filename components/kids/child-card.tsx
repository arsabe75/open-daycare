import Link from "next/link";
import ChildAvatar from "./child-avatar";
import type { Child } from "@/lib/data/children";

interface ChildCardProps {
  child: Child;
}

function parentSubtitle(age: number, count: number): string {
  const ageText = `${age} años`;
  if (count === 0) return `${ageText} · sin padres vinculados`;
  if (count === 1) return `${ageText} · 1 padre vinculado`;
  return `${ageText} · ${count} padres vinculados`;
}

export default function ChildCard({ child }: ChildCardProps) {
  const parentCount = child.linkedParents.length;

  return (
    <Link
      href={`/panel/kids/${child.id}`}
      className="flex items-center gap-3.5 min-w-0 bg-[#FFFDF9] border border-[#ECE0D0] rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:border-[#F2A78E] hover:-translate-y-0.5"
    >
      <ChildAvatar avatar={child.avatar} size="card" />
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[16px] text-[#3F362E]">
          {child.name}
        </div>
        <div className="text-[13px] text-[#A89A8B]">
          {parentSubtitle(child.age, parentCount)}
        </div>
      </div>
      {child.allergyBadge ? (
        <span className="flex-none text-[11px] font-extrabold px-2.25 py-1.25 rounded-full bg-[#FBD8CC] text-[#D9684A]">
          {child.allergyBadge}
        </span>
      ) : parentCount === 0 ? (
        <span className="flex-none text-[11px] font-extrabold px-2.25 py-1.25 rounded-full bg-[#F9D2DE] text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <svg
          className="flex-none"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#CBB89F"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </Link>
  );
}
