import Link from "next/link";
import ChildAvatar from "../child-avatar";
import type { Child, LinkedParent, ParentRelation, ParentStatus } from "@/lib/data/children";

interface LinkedParentsProps {
  child: Child;
}

function relationLabel(relation: ParentRelation): string {
  return relation === "mom" ? "Mamá" : "Papá";
}

function statusLabel(status: ParentStatus): string {
  return status === "active" ? "activa" : "invitación enviada";
}

function statusBadge(status: ParentStatus) {
  return status === "active"
    ? { text: "ACTIVA", bg: "#CFEBD8", color: "#3E9B6C" }
    : { text: "PENDIENTE", bg: "#F7E7A6", color: "#9A7B1E" };
}

function ParentRow({ parent }: { parent: LinkedParent }) {
  const badge = statusBadge(parent.status);

  return (
    <div className="flex items-center gap-3">
      <ChildAvatar avatar={parent.avatar} size="card" className="w-10 h-10 text-[16px]" />
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-[14.5px] text-[#3F362E]">
          {parent.name}
        </div>
        <div className="text-[12.5px] text-[#A89A8B]">
          {relationLabel(parent.relation)} · {statusLabel(parent.status)}
        </div>
      </div>
      <span
        className="flex-none text-[10.5px] font-extrabold px-[9px] py-1 rounded-full"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {badge.text}
      </span>
    </div>
  );
}

export default function LinkedParents({ child }: LinkedParentsProps) {
  return (
    <div className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-2xl p-4">
      <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-3.5">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-3.5">
        {child.linkedParents.map((parent) => (
          <ParentRow key={parent.id} parent={parent} />
        ))}
        <Link
          href="/link-parent"
          className="flex items-center gap-3 pt-2"
        >
          <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290] flex-none">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-extrabold text-[14.5px] text-[#C5503A]">
            Vincular otro padre
          </span>
        </Link>
      </div>
    </div>
  );
}
