import Link from "next/link";
import Sidebar from "@/components/sidebar";
import SearchBox from "@/components/kids/search-box";
import ChildCard from "@/components/kids/child-card";
import { children } from "@/lib/data/children";

export default function KidsPage() {
  const count = children.length;

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeHref="/kids" />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[880px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="flex items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C] mb-1">
                GESTIÓN
              </div>
              <h1 className="font-display font-semibold text-[30px] text-[#3F362E] m-0">
                Niños
              </h1>
            </div>
            <Link
              href="/kids/new"
              className="flex items-center gap-2 px-[18px] py-[11px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Agregar niño
            </Link>
          </div>

          <div className="mb-[22px]">
            <SearchBox />
          </div>

          <div className="flex items-center gap-3 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#3F362E]">
              SALA SOLES
            </span>
            <span className="text-[13px] text-[#A89A8B]">{count} niños</span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
